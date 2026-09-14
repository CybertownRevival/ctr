import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Service } from 'typedi';
import { Db } from '../../db/db.class';
// Aliased so the model stops shadowing the global built-in inside this file.
import { Object as ObjectModel } from '../../types/models';
import { ObjectWithUsername } from '../../repositories/object/object.repository';
import { CountRow } from '../../repositories/row.types';

import {
  ObjectRepository,
  MemberRepository,
  TransactionRepository,
  ObjectInstanceRepository,
  MallRepository,
} from '../../repositories';

/** What `ObjectService.rejectPendingObject` decided, and the row it decided on. */
/** A page of objects with the total the query counted alongside it. */
export interface ObjectListPage {
  objects: ObjectWithUsername[];
  total: CountRow[];
}

/** The stored filenames `uploadObjectFiles` wrote for one upload. */
export interface UploadedAssets {
  filename: string | null;
  image: string | null;
  texture: string | null;
}

/**
 * The final path segment of a client-supplied filename, with both `/` and
 * `\` treated as separators regardless of the server's own OS.
 *
 * A WRL commonly references its texture by filename, so a legitimate name
 * like `wood.jpg` must come back byte-for-byte -- this only strips a
 * traversal or directory prefix down to its basename, it does not replace
 * the name with something generated. `..`, `.` and an empty result are
 * rejected outright rather than silently coerced to something else.
 */
export function safeUploadBasename(rawName: string): string {
  const segments = String(rawName || '').split(/[\\/]+/);
  const base = segments[segments.length - 1];
  if (!base || base === '.' || base === '..') {
    throw new Error('Invalid upload filename');
  }
  return base;
}

/**
 * Resolves `filename` under `directory` and throws if the result would land
 * outside it.
 *
 * Belt-and-braces alongside `safeUploadBasename`: a single sanitized path
 * segment can't itself escape, but this is the actual guarantee the upload
 * path depends on, checked against the real resolved filesystem path rather
 * than inferred from the string shape.
 */
export function resolveWithinUploadPath(directory: string, filename: string): string {
  const base = path.resolve(directory);
  const target = path.resolve(base, filename);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error('Upload destination escapes its directory');
  }
  return target;
}

export interface ObjectRejection {
  outcome: string;
  object: ObjectModel | null;
}

/** Service for dealing with blocks */
@Service()
export class ObjectService {
  constructor(
    private db: Db,
    private objectRepository: ObjectRepository,
    private memberRepository: MemberRepository,
    private transactionRepository: TransactionRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
    private mallRepository: MallRepository,
  ) {}

  public static readonly WRL_FILESIZE_LIMIT = 81920;
  public static readonly TEXTURE_FILESIZE_LIMIT = 81920;
  public static readonly IMAGE_FILESIZE_LIMIT = 81920;
  public static readonly SELLER_FEE_PERCENT = 0.2;
  public static readonly STATUS_DELETED = 0;
  public static readonly STATUS_ACTIVE = 1;
  public static readonly STATUS_PENDING = 2;

  /** Outcomes of `rejectPendingObject`, which never throws for a refusal. */
  public static readonly REJECT_REJECTED = 'rejected';
  public static readonly REJECT_ALREADY_REJECTED = 'already_rejected';
  public static readonly REJECT_INVALID_STATE = 'invalid_state';
  public static readonly REJECT_NOT_FOUND = 'not_found';
  public static readonly STATUS_APPROVED = 3;
  public static readonly STATUS_INACTIVE = 4;
  public static readonly MALL_EXPIRATION_DAYS = 7;

  public async find(objectSearchParams: Partial<ObjectModel>): Promise<ObjectModel> {
    return this.objectRepository.find(objectSearchParams);
  }

  public async findById(objectId: number): Promise<ObjectModel> {
    return this.objectRepository.findById(objectId);
  }

  public async removeAccount(userId: number): Promise<void> {
    return this.objectRepository.removeAccount(userId);
  }

  public async findByObjectId(objectId: number): Promise<ObjectWithUsername[]> {
    const returnObjects = [];
    const object = await this.objectRepository.getMallObject(objectId);
    for (const obj of object) {
      const instances = await this.objectInstanceRepository.countByObjectId(obj.id);
      obj.instances = instances;
      returnObjects.push(obj);
    }
    return returnObjects;
  }

  public async findByUsername(
    username: string, 
    compare: string, 
    content: string,
    limit: number,
    offset: number): Promise<ObjectListPage> {
    const returnObjects = [];
    const user = await this.memberRepository.findIdByUsername(username);
    const object = await this.objectRepository
      .getUserUploadedObjects(user[0].id, compare, content, limit, offset);
    const total = await this.objectRepository.totalCreator('status', compare, content, user[0].id);
    for (const obj of object) {
      const instances = await this.objectInstanceRepository.countByObjectId(obj.id);
      const store = await this.mallRepository.getStore(obj.id);
      obj.instances = instances;
      obj.store = store[0];
      returnObjects.push(obj);
    }
    return {objects: returnObjects, total: total};
  }

  public async findByMemberId(
    id: number, 
    compare: string, 
    content: string,
    limit: number,
    offset: number): Promise<ObjectListPage> {
    const returnObjects = [];
    const object = await this.objectRepository
      .getUserUploadedObjects(id, compare, content, limit, offset);
    const total = await this.objectRepository.totalCreator('status', compare, content, id);
    for (const obj of object) {
      const instances = await this.objectInstanceRepository.countByObjectId(obj.id);
      const store = await this.mallRepository.getStore(obj.id);
      obj.instances = instances;
      obj.store = store[0];
      returnObjects.push(obj);
    }
    return {objects: returnObjects, total: total};
  }

  public async getPendingObjects() {
    return await this.objectRepository.findByStatus(ObjectService.STATUS_PENDING);
  }

  public async getMallForSaleObjects(placeId: number) {
    const objects = await this.mallRepository.getMallForSale(
      placeId,
    );
    return objects;
  }

  /**
   * Rejects a pending object and refunds its upload fee as a single commit.
   *
   * The refund moves real money, so the wallet credit, the ledger row and the
   * object's status change all have to land together or not at all. Two separate
   * commits leave a window either way round: reject-then-refund can strand an
   * object marked deleted whose uploader was never paid, and refund-then-reject
   * can pay an uploader for an object that is still pending, which a retry then
   * pays for again.
   *
   * The row is read `FOR UPDATE` and its status re-checked inside the
   * transaction, so a second concurrent rejection blocks until the first commits
   * and then observes STATUS_DELETED rather than the pending status it saw
   * before either began. That is what makes "exactly one refund" true under
   * concurrency rather than only in sequence.
   *
   * The uploader's notification is deliberately NOT part of this: it is attempted
   * by the caller after the commit, because a mail failure must not roll back a
   * completed refund.
   */
  public async rejectPendingObject(objectId: number): Promise<ObjectRejection> {
    return this.db.knex.transaction(async trx => {
      const object = await this.objectRepository.findByIdForUpdate(objectId, trx);

      if (!object) {
        return { outcome: ObjectService.REJECT_NOT_FOUND, object: null };
      }
      if (object.status === ObjectService.STATUS_DELETED) {
        return { outcome: ObjectService.REJECT_ALREADY_REJECTED, object };
      }
      if (object.status !== ObjectService.STATUS_PENDING) {
        // Not a pending submission, so there is no upload fee to hand back and
        // nothing to triage. Refusing is the only safe answer: the alternative
        // is refunding a stocked object because a stale page asked us to.
        return { outcome: ObjectService.REJECT_INVALID_STATE, object };
      }

      // An object whose uploader no longer exists is still rejectable; there is
      // simply no wallet to credit.
      if (object.member_id) {
        const member = await this.memberRepository.findById(object.member_id, trx);
        if (member && member.wallet_id) {
          await this.transactionRepository.createObjectUploadRefundTransaction(
            member.wallet_id,
            this.getSellerFee(object.quantity, object.price),
            trx,
          );
        }
      }

      await this.objectRepository.update(
        objectId,
        { status: ObjectService.STATUS_DELETED },
        trx,
      );

      return { outcome: ObjectService.REJECT_REJECTED, object };
    });
  }

  /**
   * Approves a pending object.
   *
   * Like the rejection, this reads the row `FOR UPDATE` and re-checks the status
   * inside the transaction, so an approval cannot be applied to an object that
   * is not a pending submission and two concurrent approvals cannot both add the
   * same mall_object row. There is no money involved, but the state transition
   * is just as much the server's to decide as the browser's.
   *
   * `addToMallObjects` was previously fired without being awaited, so the status
   * update could commit -- and the request report success -- before the object
   * had been placed in the Mall at all.
   */
  public async approvePendingObject(objectId: number): Promise<ObjectRejection> {
    return this.db.knex.transaction(async trx => {
      const object = await this.objectRepository.findByIdForUpdate(objectId, trx);

      if (!object) {
        return { outcome: ObjectService.REJECT_NOT_FOUND, object: null };
      }
      if (object.status === ObjectService.STATUS_APPROVED) {
        return { outcome: ObjectService.REJECT_ALREADY_REJECTED, object };
      }
      if (object.status !== ObjectService.STATUS_PENDING) {
        return { outcome: ObjectService.REJECT_INVALID_STATE, object };
      }

      // Both inside the transaction: the insert takes a foreign-key lock on the
      // object row this transaction already holds, so on another connection it
      // would deadlock against itself.
      const existing = await this.mallRepository.findByObjectId(objectId, trx);
      if (existing.length === 0) {
        await this.mallRepository.addToMallObjects(objectId, trx);
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + ObjectService.MALL_EXPIRATION_DAYS);

      await this.objectRepository.update(
        objectId,
        {
          status: ObjectService.STATUS_APPROVED,
          mall_expiration: expirationDate.toJSON().slice(0, 19).replace('T', ' '),
        },
        trx,
      );

      return { outcome: ObjectService.REJECT_REJECTED, object };
    });
  }

  public async updateStatusApproved(objectId: number) {
    const checkExist = await this.mallRepository.findByObjectId(objectId);
    if(checkExist.length === 0) {
      await this.mallRepository.addToMallObjects(objectId);
    }
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + ObjectService.MALL_EXPIRATION_DAYS);

    return await this.objectRepository.update(objectId, {
      status: ObjectService.STATUS_APPROVED,
      mall_expiration: expirationDate.toJSON().slice(0, 19).replace('T', ' '),
    });
  }

  public async updateObjectPlace(objectId: number, shopId: number) {
    await this.mallRepository.findByObjectId(objectId)
      .then(data => {
        if(!data[0]){
          this.mallRepository.addToMallObjects(objectId);
        }
      });
    await this.mallRepository.updateObjectPlace(objectId, shopId);

    return await this.objectRepository.update(objectId, {
      status: ObjectService.STATUS_ACTIVE,
    });
  }

  public async removeMallObject(objectId: number) {
    return await this.objectRepository.update(objectId, {
      status: ObjectService.STATUS_APPROVED,
    });
  }

  public async deleteMallObject(objectId: number) {
    return await this.objectRepository.update(objectId, {
      status: ObjectService.STATUS_DELETED,
    });
  }

  public async increaseQuantity(objectId: number, quantity: number, status: number) {
    if(status === 1){
      return await this.objectRepository.increaseObjectQuantity(objectId, {
        quantity: quantity,
      });
    } else {
      return await this.objectRepository.increaseObjectQuantity(objectId, {
        quantity: quantity,
        status: ObjectService.STATUS_APPROVED,
      });
    }
    
  }

  public async updateObjectLimit(objectId: number, limit: number) {
    return await this.objectRepository.updateObjectLimit(objectId, limit);
  }
  
  public async updateObjectName(objectId: number, name: string) {
    return await this.objectRepository.updateObjectName(objectId, name);
  }

  public async updateStatusRejected(objectId: number) {
    return await this.objectRepository.update(objectId, {
      status: ObjectService.STATUS_DELETED,
    });
  }

  public async updateObjectQuantity(objectId: number, quantity: number) {
    return await this.objectRepository.update(objectId, {
      quantity: quantity,
      status: ObjectService.STATUS_INACTIVE,
    });
  }

  /**
   * Object upload directory for a given directory name (== the row's uuid).
   *
   * Split out so `create()` can find the same path for cleanup after this
   * has already run, without recomputing the join logic differently in two
   * places.
   */
  private objectUploadPath(directoryName: string): string {
    return `${process.env.ASSETS_DIR}/object/${directoryName}`;
  }

  public async uploadObjectFiles(
    directoryName,
    fileName,
    wrlFile,
    imageFile,
    textureFile?,
  ): Promise<UploadedAssets> {
    const uploadPath = this.objectUploadPath(directoryName);
    const response: UploadedAssets = {
      filename: null,
      image: null,
      texture: null,
    };

    fs.mkdirSync(uploadPath);
    try {
      const wrlFilename = `${fileName}.wrl`;
      await wrlFile.mv(resolveWithinUploadPath(uploadPath, wrlFilename));
      response.filename = wrlFilename;

      // The extension is derived from a sanitized basename, not the raw
      // client name, so a dot-free traversal payload can't smuggle a `/`
      // into what gets appended after `fileName`.
      const imageExtension = safeUploadBasename(imageFile.name).split('.').pop();
      const imageFilename = `${fileName}.${imageExtension}`;
      await imageFile.mv(resolveWithinUploadPath(uploadPath, imageFilename));
      response.image = imageFilename;

      if (textureFile) {
        // Kept byte-for-byte when it's already a safe ordinary filename --
        // a WRL commonly references its texture by name -- and only
        // stripped to its basename when it carries a directory or
        // traversal prefix.
        const textureFilename = safeUploadBasename(textureFile.name);
        await textureFile.mv(resolveWithinUploadPath(uploadPath, textureFilename));
        response.texture = textureFilename;
      }
    } catch (error) {
      // Best-effort: an upload that fails partway through must not leave
      // orphaned files behind for a directory name that will never be
      // recorded in the database.
      fs.rmSync(uploadPath, { recursive: true, force: true });
      throw error;
    }
    return response;
  }

  /**
   * returns the seller fee for submitting an object
   *
   * @param quantity
   * @param price
   * @returns
   */
  public getSellerFee(quantity: number, price: number): number {
    return quantity * price * ObjectService.SELLER_FEE_PERCENT;
  }

  /**
   * create an object (file upload and record)
   * @param wrlFile
   * @param imageFile
   * @param textureFile
   * @param name
   * @param quantity
   * @param price
   * @param memberId
   */
  public async create(
    wrlFile, imageFile, textureFile, name, quantity, price, memberId,
  ): Promise<number> {
    const uuid = crypto.randomUUID();
    const fileName = crypto.randomBytes(8).toString('hex');

    const assets = await this.uploadObjectFiles(
      uuid,
      fileName,
      wrlFile,
      imageFile,
      textureFile ?? null,
    );

    try {
      // Awaited and returned, not fired-and-forgotten: the caller charges
      // the upload fee and reports success right after this resolves, and
      // must not be able to do either before the row actually exists.
      return await this.objectRepository.create(
        uuid,
        assets.filename,
        assets.image,
        assets.texture,
        name,
        quantity,
        price,
        memberId,
      );
    } catch (error) {
      // The files wrote successfully but the row never will, so they would
      // otherwise be orphaned under a uuid nothing references.
      fs.rmSync(this.objectUploadPath(uuid), { recursive: true, force: true });
      throw error;
    }
  }

  /**
   * Deducts the amount for an object upload from a member's wallet
   * @param memberId id of a member
   * @param amount amount to deduct
   */
  public async performObjectUploadTransaction(memberId: number, amount: number): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    await this.transactionRepository.createObjectUploadTransaction(member.wallet_id, amount);
  }

  public async performObjectRestockTransaction(memberId: number, amount: number): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    await this.transactionRepository.createObjectRestockTransaction(member.wallet_id, amount);
  }

  /**
   * Refunds the amount for an object upload to a member's wallet
   * @param memberId id of a member
   * @param amount amount to refund
   */
  public async performObjectUploadRefundTransaction(
    memberId: number,
    amount: number,
  ): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    await this.transactionRepository.createObjectUploadRefundTransaction(member.wallet_id, amount);
  }

  public async performUnsoldObjectRefundTransaction(
    memberId: number,
    amount: number,
  ): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    await this.transactionRepository.createUnsoldObjectRefundTransaction(member.wallet_id, amount);
  }

  public async performObjectPurchaseTransaction(memberId: number, amount: number): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    await this.transactionRepository.createObjectPurchaseTransaction(member.wallet_id, amount);
  }

  public async performObjectProfitTransaction(memberId: number, amount: number): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    await this.transactionRepository.createObjectProfitTransaction(member.wallet_id, amount);
  }
}
