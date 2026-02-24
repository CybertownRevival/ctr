import crypto from 'crypto';
const fs = require('fs');
import { Service } from 'typedi';
import { Object } from '../../types/models';

import {
  ObjectRepository,
  MemberRepository,
  TransactionRepository,
  ObjectInstanceRepository,
  MallRepository,
} from '../../repositories';

/** Service for dealing with blocks */
@Service()
export class ObjectService {
  constructor(
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
  public static readonly STATUS_APPROVED = 3;
  public static readonly STATUS_INACTIVE = 4;
  public static readonly MALL_EXPIRATION_DAYS = 7;

  public async find(objectSearchParams: Partial<Object>): Promise<Object> {
    return this.objectRepository.find(objectSearchParams);
  }

  public async findById(objectId: number): Promise<Object> {
    return this.objectRepository.findById(objectId);
  }

  public async findByObjectId(objectId: number): Promise<any> {
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
    offset: number): Promise<any> {
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
    offset: number): Promise<any> {
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

  public async updateStatusApproved(objectId: number) {
    const checkExist = await this.mallRepository.findByObjectId(objectId);
    if(checkExist.length === 0) {
      this.mallRepository.addToMallObjects(objectId);
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

  public async uploadObjectFiles(
    directoryName,
    fileName,
    wrlFile,
    imageFile,
    textureFile?,
  ): Promise<any> {
    let uploadPath = process.env.ASSETS_DIR + '/object/' + directoryName;
    const response = {
      filename: null,
      image: null,
      texture: null,
    };

    fs.mkdirSync(uploadPath);
    wrlFile.mv(uploadPath + '/' + fileName + '.wrl');
    response.filename = fileName + '.wrl';

    let imageExtension = imageFile.name.split('.').pop();
    imageFile.mv(uploadPath + '/' + fileName + '.' + imageExtension);
    response.image = fileName + '.' + imageExtension;

    if (textureFile) {
      textureFile.mv(uploadPath + '/' + textureFile.name);
      response.texture = textureFile.name;
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
  public async create(wrlFile, imageFile, textureFile, name, quantity, price, memberId) {
    let uuid = crypto.randomUUID();
    let fileName = crypto.randomBytes(8).toString('hex');

    const assets = await this.uploadObjectFiles(
      uuid,
      fileName,
      wrlFile,
      imageFile,
      textureFile ?? null,
    );

    this.objectRepository.create(
      uuid,
      assets.filename,
      assets.image,
      assets.texture,
      name,
      quantity,
      price,
      memberId,
    );
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
