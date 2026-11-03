import { Request, Response } from 'express';
import { Container } from 'typedi';

import {
  MemberService,
  MallService,
  MallExportService,
  MallInspectionService,
  ObjectService,
  WalletService,
  ObjectInstanceService,
  InboxService,
} from '../services';
import { PlaceRepository } from '../repositories';
import { Object as ObjectModel } from '../types/models';
import {
  createResponseWriter,
  EXPORT_ERROR_CODES,
  exportFilename,
  MAX_DURATION_MS,
} from '../services/mall-export/mall-export.service';
// Removed unused import
/**
 * Reads a route object id, rejecting anything that is not wholly a positive
 * integer.
 *
 * `parseInt` stops at the first character it cannot use, so `3339-not-an-id`
 * reads as 3339 and the request quietly acts on a different object than the one
 * named in the URL.
 */
/**
 * Longest rejection reason accepted.
 *
 * The inbox body column is TEXT, so this is not a storage limit; it is a bound
 * on staff-authored input, refused rather than silently truncated so the
 * uploader never receives half an explanation.
 */
const MAX_REJECTION_REASON = 2000;

function parseObjectId(value: string): number | null {
  if (!/^[0-9]+$/.test(String(value || ''))) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export class MallController {
  constructor(
    private memberService: MemberService,
    private mallService: MallService,
    private objectService: ObjectService,
    private walletService: WalletService,
    private objectInstanceService: ObjectInstanceService,
    private mallInspectionService: MallInspectionService,
    private mallExportService: MallExportService,
    private inboxService: InboxService,
    private placeRepository: PlaceRepository,
  ) {}

  /**
   * The Mall staff gate every staff-only endpoint goes through.
   *
   * Same token decode and same `canAdmin` role check the existing staff handlers
   * perform inline, and the same response on failure, so authorisation behaviour
   * stays identical across the whole mall API.
   */
  private async requireMallStaff(request: Request, response: Response): Promise<boolean> {
    const { apitoken } = request.headers;

    try {
      // decodeMemberToken THROWS on a missing or malformed token rather than
      // returning null. Without this catch the rejection escapes the async
      // handler, Express never sends a response, and the request hangs.
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (session && (await this.mallService.canAdmin(session.id))) {
        return true;
      }
    } catch (error) {
      // Fall through to the same denial the rest of the mall API returns.
    }

    response.status(400).json({
      error: 'Invalid or missing token or access denied.',
    });
    return false;
  }

  /**
   * Everything a checker needs about one object on a single screen: the CTR
   * record, its counts and views, the stored file's real shape, its WorldInfo,
   * and where the two disagree.
   *
   * Staff-only because it exposes the object's source facts. The existing
   * `/mall/object/:id` and `/object/get_object/:id` endpoints deliberately keep
   * their current, narrower payloads and their current authorisation.
   */
  public async getObjectInspection(request: Request, response: Response): Promise<void> {
    if (!(await this.requireMallStaff(request, response))) {
      return;
    }

    const objectId = parseObjectId(request.params.id);
    if (objectId === null) {
      response.status(400).json({ error: 'Invalid object id.' });
      return;
    }

    try {
      const inspection = await this.mallInspectionService.inspect(objectId);
      if (!inspection) {
        response.status(404).json({ error: 'Object not found.' });
        return;
      }
      response.status(200).json({ status: 'success', inspection });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  /**
   * The decoded VRML text, so staff can read a gzip-compressed upload without
   * downloading it and decompressing it by hand.
   *
   * The download filename is always the server-generated `object-<id>.wrl`, never
   * the member-supplied object name and never the stored filename. That keeps
   * header injection, quoting, and non-ASCII encoding out of the picture
   * entirely.
   */
  /**
   * Streams CTR's authoritative Mall dataset.
   *
   * The outcome is written at the END of the document as `result`, because the
   * counts and per-object failures are not known until the work is finished.
   * Once streaming has begun the HTTP status is already 200, so `result.status`
   * is the authoritative outcome and consumers must check it. Failures detected
   * before the first byte - authorisation, most obviously - still return a
   * normal error status with no body at all.
   */
  public async exportMallData(request: Request, response: Response): Promise<void> {
    if (!(await this.requireMallStaff(request, response))) {
      return;
    }

    const includeDerived = request.query.derived === '1';

    // Captured before preflight, not after: preflight runs real queries and is
    // not free, so it must count against the advertised budget too. Resetting
    // the clock here would let an expensive preflight run for free and hand
    // the streaming body a fresh MAX_DURATION_MS on top of it.
    const startedAt = Date.now();

    // Everything global runs before the response is committed, so a failure here
    // is an ordinary error rather than a half-written document the client would
    // have to detect by failing to parse it.
    let preflight;
    try {
      preflight = await this.mallExportService.preflight();
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: EXPORT_ERROR_CODES.preflightFailed });
      return;
    }

    // Preflight alone already exhausted the budget: no document could finish
    // from here, so the honest response is an ordinary failure before the body
    // starts, not a stream nothing will ever complete.
    if (Date.now() - startedAt > MAX_DURATION_MS) {
      response.status(503).json({ error: EXPORT_ERROR_CODES.budgetExceeded });
      return;
    }

    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportFilename(new Date())}"`,
    );
    response.status(200);

    try {
      await this.mallExportService.export(
        createResponseWriter(response),
        { includeDerived, startedAt },
        preflight,
      );
    } catch (error) {
      console.error(error);
    } finally {
      response.end();
    }
  }

  public async getObjectSource(request: Request, response: Response): Promise<void> {
    if (!(await this.requireMallStaff(request, response))) {
      return;
    }

    const objectId = parseObjectId(request.params.id);
    if (objectId === null) {
      response.status(400).json({ error: 'Invalid object id.' });
      return;
    }

    try {
      const source = await this.mallInspectionService.readSourceText(objectId);

      if (source.error === 'not_found' || source.error === 'missing') {
        response.status(404).json({ error: 'Object source not found.' });
        return;
      }
      if (source.error !== null || source.text === null) {
        response.status(422).json({ error: source.error || 'unreadable' });
        return;
      }

      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      if (request.query.download === '1') {
        response.setHeader(
          'Content-Disposition',
          `attachment; filename="object-${objectId}.wrl"`,
        );
      }
      response.status(200).send(source.text);
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async canAdmin(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findStores(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const orderBy = request.query.orderBy;
    try{
      const stores = await this.mallService.getMallStores(<string>orderBy);
      response.status(200).json({ status: 'success', stores: stores });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }

  }

  public async findSoldOutObjects(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const objects = await this.mallService.findSoldOut();
      response.status(200).json({ status: 'success', objects: objects });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getObjectsCatalog(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    try {
      const results = await this.mallService.getObjectsCatalog(
        Number.parseInt(request.query.limit.toString()),
        Number.parseInt(request.query.offset.toString()),
      );
      response.status(200).json({results});
    } catch (error) {
      console.log(error);
      response.status(400).json({error});
    }
  }

  public async searchMallObjects(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.mallService.canAdmin(session.id);
    if (admin) {
      try {
        const search = request.query.search.toString().replace(/[^0-9a-zA-Z \-[\]/()]/g, '');
        const results = await this.mallService.searchMallObjects(
          search,
          Number.parseInt(request.query.limit.toString()),
          Number.parseInt(request.query.offset.toString()),
        );
        response.status(200).json({results});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async searchAllObjects(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.mallService.canAdmin(session.id);
    if (admin) {
      try {
        const compareValues = ['=', '!=', '>', '<', '>=', '<='];
        const search = request.query.search.toString().replace(/[^0-9a-zA-Z \-[\]/()]/g, '');
        const compare = request.query.compare.toString();
        const status = parseInt(request.query.status.toString());

        if(compareValues.includes(compare)){
          const results = await this.mallService.searchAllObjects(
            search,
            compare,
            status,
            Number.parseInt(request.query.limit.toString()),
            Number.parseInt(request.query.offset.toString()),
          );
          response.status(200).json({results});
        }
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async findAllObjects(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const columnValues = ['id', 'member_id', 'name', 'status'];
      const compareValues = ['=', '!=', '>', '<', '>=', '<='];
      const orderValues = ['ASC', 'DESC'];
      
      const column = request.query.column.toString();
      const compare = request.query.compare.toString();
      const content = request.query.content.toString();
      const order = request.query.orderBy.toString();

      if(columnValues.includes(column) && 
        compareValues.includes(compare) && 
        orderValues.includes(order)){
        const objects = await this.mallService
          .getAllObjects(
            column,
            compare,
            content,
            Number(request.query.limit), 
            Number(request.query.offset),
            order,
          );
        response.status(200).json({ status: 'success', objects: objects });
      } else {
        response.status(400).json({ status: 'Failed: Invalid search params'});
      } 
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }

  }

  public async objectsPendingApproval(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const objects = await this.objectService.getPendingObjects();
      const returnObjects = [];

      for (const obj of objects) {
        const member = await this.memberService.find({ id: obj.member_id });
        obj.username = member.username;
        returnObjects.push(obj);
      }
      response.status(200).json({ status: 'success', objects: returnObjects });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  /**
   * Tells an uploader their object was accepted.
   *
   * Deliberately the same architecture as `notifyRejection`: the uploader, their
   * home place and the object's name are all resolved server-side from the row
   * the moderation transaction returned, so the browser cannot choose who is
   * told about an acceptance or what the notice claims happened.
   *
   * No date is invented. There is no authoritative next-Mall-drop date in this
   * workflow, so the notice says the item is waiting for the next drop rather
   * than promising one on a day nothing guarantees.
   *
   * Returns whether the notice was actually delivered; the caller reports that
   * rather than claiming a notification that did not happen.
   */
  private async notifyApproval(
    staffMemberId: number,
    objectRecord: ObjectModel,
  ): Promise<boolean> {
    try {
      if (!objectRecord.member_id) {
        return false;
      }
      const home = await this.placeRepository.findHomeByMemberId(objectRecord.member_id);
      if (!home || !home.id) {
        return false;
      }
      // Control characters in a stored name must not break the subject line.
      const name = String(objectRecord.name || '').replace(/[\r\n\t]+/g, ' ').trim();
      const body = await this.inboxService.sanitize(
        `Your Mall item "${name}" was accepted by Mall staff.\n\n`
        + 'It is now marked Coming Soon and is waiting in the Mall Warehouse for the '
        + 'next Mall drop.',
      );
      if (!body) {
        return false;
      }
      await this.inboxService.postInboxMessage(staffMemberId, home.id, `accepted - ${name}`, body);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async approveObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      const objectId = parseObjectId(request.body.objectId);
      if (objectId === null) {
        response.status(400).json({
          error: 'Invalid or missing object id.',
        });
        return;
      }

      // Same authority as Reject: the status is re-checked under a row lock, so
      // approving is not something a stale page or a crafted request can apply
      // to an object that was never a pending submission.
      const approval = await this.objectService.approvePendingObject(objectId);

      if (approval.outcome === ObjectService.REJECT_NOT_FOUND) {
        response.status(400).json({
          error: 'Invalid or missing object id.',
        });
        return;
      }
      if (approval.outcome === ObjectService.REJECT_INVALID_STATE) {
        response.status(400).json({
          error: 'Only a pending object can be accepted.',
        });
        return;
      }
      if (approval.outcome === ObjectService.REJECT_ALREADY_REJECTED) {
        // A concurrent Accept already won the row lock and performed the real
        // Pending -> Warehouse transition. This request moved nothing, so it
        // must not send a second acceptance notice for the same acceptance.
        response.status(200).json({ status: 'success', notified: false, alreadyAccepted: true });
        return;
      }

      // Only now, with the transition committed. A failure here cannot undo it,
      // so it is reported rather than raised: a 500 would invite a retry that
      // the guard above would answer with a bare success.
      const notified = await this.notifyApproval(session.id, approval.object);

      response.status(200).json({ status: 'success', notified });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async dropMallObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      await this.objectService.updateObjectPlace(
        parseInt(request.body.objectId),parseInt(request.body.shopId));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async removeMallObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      this.objectService.removeMallObject(
        parseInt(request.body.objectId));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async deleteMallObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      this.objectService.deleteMallObject(
        parseInt(request.body.objectId));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async updateObjectLimit(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      await this.objectService.updateObjectLimit(
        parseInt(request.body.objectId),request.body.limit);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async updateObjectName(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      await this.objectService.updateObjectName(
        parseInt(request.body.objectId),request.body.name);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  /**
   * Tells an uploader why their object was rejected, through the same place
   * inbox staff already use by hand.
   *
   * Recipient, subject and object name are resolved here from stored data. The
   * browser sends only the object id and the reason, so it cannot choose who is
   * told about a rejection or what the notice claims happened.
   *
   * Returns whether the notice was actually delivered; the caller reports that
   * rather than claiming a notification that did not happen.
   */
  private async notifyRejection(
    staffMemberId: number,
    objectRecord: ObjectModel,
    reason: string,
  ): Promise<boolean> {
    try {
      if (!objectRecord.member_id) {
        return false;
      }
      const home = await this.placeRepository.findHomeByMemberId(objectRecord.member_id);
      if (!home || !home.id) {
        return false;
      }
      const body = await this.inboxService.sanitize(reason);
      if (!body) {
        return false;
      }
      // Control characters in a stored name must not break the subject line.
      const name = String(objectRecord.name || '').replace(/[\r\n\t]+/g, ' ').trim();
      await this.inboxService.postInboxMessage(staffMemberId, home.id, `rejected - ${name}`, body);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async rejectObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      // Validated before anything mutates, so a missing reason can never leave
      // an object rejected with its uploader untold.
      const reason = typeof request.body.reason === 'string' ? request.body.reason.trim() : '';
      if (reason === '') {
        response.status(400).json({
          error: 'A reason for rejection is required.',
        });
        return;
      }
      if (reason.length > MAX_REJECTION_REASON) {
        response.status(400).json({
          error: `A rejection reason may be at most ${MAX_REJECTION_REASON} characters.`,
        });
        return;
      }

      const objectId = parseObjectId(request.body.id);
      if (objectId === null) {
        response.status(400).json({
          error: 'Invalid or missing object id.',
        });
        return;
      }

      // Everything that moves state or money happens inside one transaction that
      // locks the object row, so two staff rejecting the same object at the same
      // moment produce exactly one refund. The service decides the outcome from
      // the status it reads under that lock, never from what the browser thinks.
      const rejection = await this.objectService.rejectPendingObject(objectId);

      if (rejection.outcome === ObjectService.REJECT_NOT_FOUND) {
        response.status(400).json({
          error: 'Invalid or missing object id.',
        });
        return;
      }
      if (rejection.outcome === ObjectService.REJECT_INVALID_STATE) {
        // A stale page, or a crafted request. Staff authorisation is not a
        // licence to refund an object that was never a pending submission.
        response.status(400).json({
          error: 'Only a pending object can be rejected.',
        });
        return;
      }
      if (rejection.outcome === ObjectService.REJECT_ALREADY_REJECTED) {
        response.status(200).json({ status: 'success', notified: false, alreadyRejected: true });
        return;
      }

      // Only now, with the refund and the status change committed. A failure
      // here cannot undo them, so it is reported rather than raised: a 500 would
      // invite a retry that the guard above would answer with a bare success.
      const notified = await this.notifyRejection(session.id, rejection.object, reason);

      response.status(200).json({ status: 'success', notified });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async refundUnsoldInstances(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      const objectRecord = await this.objectService.findById(parseInt(request.body.id));
      if (!objectRecord) {
        response.status(400).json({
          error: 'Invalid or missing object id.',
        });
        return;
      }

      const instances = await this.objectInstanceService.countById(objectRecord.id);
      const unsoldInstances = objectRecord.quantity - instances;
      const newQuantity = objectRecord.quantity - unsoldInstances;

      const sellersFee = await this.objectService.getSellerFee(
        unsoldInstances,
        objectRecord.price,
      );

      this.objectService.updateObjectQuantity(objectRecord.id, newQuantity);

      this.objectService.performUnsoldObjectRefundTransaction(objectRecord.member_id, sellersFee);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async objectsForSale(request: Request, response: Response): Promise<void> {
    try {
      const placeId = parseInt(request.params.id);
      const objects = await this.objectService.getMallForSaleObjects(placeId);
      response.status(200).json({ status: 'success', objects: objects });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findByObjectId(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const object = await this.objectService.findByObjectId(parseInt(request.params.id));
      response.status(200).json({ status: 'success', object: object });
    } catch(error){
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const object = await this.objectService.findById(parseInt(request.params.id));
      const username = await this.memberService.getMemberInfo(object.member_id);
      response.status(200)
        .json({status: 'success', object: object, username: username.username });
    } catch(error){
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findStore(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const place = await this.mallService.getStore(parseInt(request.params.id));
      response.status(200).json({ status: 'success', place: place });
    } catch(error){
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findByUsername(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token or access denied.',
      });
      return;
    }
    const username = request.body.username;
    const compare = request.body.compare.toString().replace(/[^0-9]/g, '');
    const status = request.body.status.toString().replace(/[^0-9]/g, '');
    const limit = request.body.limit.toString().replace(/[^0-9]/g, '');
    const offset = request.body.offset.toString().replace(/[^0-9]/g, '');
    const compareValues = ['=', '!=', '>', '<', '>=', '<='];
    if(!username || !compare || !status || !limit){
      throw new Error('Missing required search parameters');
    }
    if(compare > '5' || status > '4' || limit < '10'){
      throw new Error('Invalid search parameters');
    }
    try {
      const object = await this.objectService
        .findByUsername(
          username, 
          compareValues[compare], 
          status,
          limit,
          offset);
      response.status(200).json({ status: 'success', object: object });
    } catch(error){
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findById(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token or access denied.',
      });
      return;
    }
    const id = request.params.id;
    const limit = request.query.limit.toString();
    const offset = request.query.offset.toString();
    try {
      const object = await this.objectService
        .findByMemberId(
          parseInt(id), 
          '>=', 
          '1',
          parseInt(limit),
          parseInt(offset));
      response.status(200).json({ status: 'success', object: object });
    } catch(error){
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async updateObjectPosition(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session || !(await this.mallService.canAdmin(session.id))) {
      response.status(400).json({
        error: 'Invalid or missing token or access denied.',
      });
      return;
    }
    try {
      if (
        typeof request.body?.position.x === 'undefined' ||
        typeof request.body?.position.y === 'undefined' ||
        typeof request.body?.position.z === 'undefined' ||
        typeof request.body?.rotation.x === 'undefined' ||
        typeof request.body?.rotation.y === 'undefined' ||
        typeof request.body?.rotation.z === 'undefined' ||
        typeof request.body?.rotation.angle === 'undefined'
      ) {
        throw new Error('Invalid position or rotation.');
      }

      const id = Number.parseInt(request.params.id);

      await this.mallService.updateObjectPlacement(
        id,
        request.body.position,
        request.body.rotation,
      );

      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  public async buyObject(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const isForSale = await this.mallService.isObjectAvailable(request.body.id);
      if (!isForSale) {
        response.status(400).json({
          error: 'Object is no longer available.',
        });
        return;
      }

      const object = await this.objectService.findById(request.body.id);
      const member = await this.memberService.find({ id: session.id });
      const wallet = await this.walletService.findById(member.wallet_id);
      if (object.price > wallet.balance) {
        response.status(400).json({
          error: 'Not enough funds to buy this object.',
        });
        return;
      }

      await this.objectInstanceService.add(object, session.id);
      await this.objectService.performObjectPurchaseTransaction(session.id, object.price);
      await this.objectService.performObjectProfitTransaction(object.member_id, object.price);

      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
}
const memberService = Container.get(MemberService);
const mallService = Container.get(MallService);
const objectService = Container.get(ObjectService);
const walletService = Container.get(WalletService);
const objectInstanceService = Container.get(ObjectInstanceService);
const mallInspectionService = Container.get(MallInspectionService);
const mallExportService = Container.get(MallExportService);
const inboxService = Container.get(InboxService);
const placeRepository = Container.get(PlaceRepository);
export const mallController = new MallController(
  memberService,
  mallService,
  objectService,
  walletService,
  objectInstanceService,
  mallInspectionService,
  mallExportService,
  inboxService,
  placeRepository,
);

