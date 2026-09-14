import { Request, Response } from 'express';
import { createSpyObj } from 'jest-createspyobj';

// Importing a controller pulls in the services barrel, which instantiates every
// repository - and RoleRepository queries on construction. Without this the spec
// would try to open a real MySQL connection.
jest.mock('../db/db.class', () =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@spec/mocks/db-module.mock').mockDbModule());

import { MallController } from './mall.controller';
import {
  InboxService,
  MallExportService,
  MallInspectionService,
  MallService,
  MemberService,
  ObjectInstanceService,
  ObjectService,
  WalletService,
} from '../services';
import { PlaceRepository } from '../repositories';
import { EXPORT_ERROR_CODES, MAX_DURATION_MS } from '../services/mall-export/mall-export.service';

/**
 * A response double.
 *
 * Typed as an Express `Response` so it can be handed to the real handlers, and
 * intersected with the jest mocks the assertions read back. The single cast in
 * the factory is the honest part: this object only implements what the handlers
 * under test actually call.
 */
type MockResponse = jest.Mocked<Response> & {
  headers: { [name: string]: string };
};

function mockResponse(): MockResponse {
  const response = {} as MockResponse;
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  response.send = jest.fn().mockReturnValue(response);
  response.headers = {};
  response.setHeader = jest.fn((name: string, value: string) => {
    response.headers[name] = value;
    return response;
  }) as unknown as MockResponse['setHeader'];
  return response;
}

/** A request double, carrying only what the handlers under test read. */
type MockRequest = Request;

function request(
  params: { [key: string]: string } = {},
  query: { [key: string]: string } = {},
  apitoken = 'staff-token',
): MockRequest {
  return { params, query, headers: { apitoken } } as unknown as MockRequest;
}

const INSPECTION = {
  object: { id: 3339, name: 'Pocket Moon Playset' },
  source: { encoding: 'gzip', storedBytes: 23002, decodedBytes: 108310 },
  vrml: { header: '#VRML V2.0 utf8' },
  findings: [],
};

describe('MallController - staff-only inspection endpoints', () => {
  let memberService: jest.Mocked<MemberService>;
  let mallService: jest.Mocked<MallService>;
  let objectService: jest.Mocked<ObjectService>;
  let walletService: jest.Mocked<WalletService>;
  let objectInstanceService: jest.Mocked<ObjectInstanceService>;
  let mallInspectionService: jest.Mocked<MallInspectionService>;
  let mallExportService: jest.Mocked<MallExportService>;
  let inboxService: jest.Mocked<InboxService>;
  let placeRepository: jest.Mocked<PlaceRepository>;
  let controller: MallController;

  beforeEach(() => {
    memberService = createSpyObj(MemberService);
    mallService = createSpyObj(MallService);
    objectService = createSpyObj(ObjectService);
    walletService = createSpyObj(WalletService);
    objectInstanceService = createSpyObj(ObjectInstanceService);
    mallInspectionService = createSpyObj(MallInspectionService);
    mallExportService = createSpyObj(MallExportService);
    inboxService = createSpyObj(InboxService);
    placeRepository = createSpyObj(PlaceRepository);
    controller = new MallController(
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

    memberService.decodeMemberToken.mockReturnValue({ id: 7 } as never);
    mallService.canAdmin.mockResolvedValue(true);
  });

  describe('the staff guard', () => {
    /**
     * decodeMemberToken THROWS on a missing or malformed token, it does not
     * return null. A guard that only handles the null case lets the rejection
     * escape the async handler, and Express then never responds - the request
     * hangs rather than being denied. Every staff endpoint is checked, because
     * the failure is invisible unless the mock throws the way the real service
     * does.
     */
    beforeEach(() => {
      memberService.decodeMemberToken.mockImplementation(() => {
        throw new Error('jwt must be provided');
      });
    });

    it('denies rather than hangs when the token decode throws', async () => {
      const response = mockResponse();

      await controller.getObjectInspection(request({ id: '3339' }, {}, undefined), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Invalid or missing token or access denied.',
      });
      expect(mallInspectionService.inspect).not.toHaveBeenCalled();
    });

    it('denies rather than hangs on the source endpoint', async () => {
      const response = mockResponse();

      await controller.getObjectSource(request({ id: '3339' }, {}, undefined), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(mallInspectionService.readSourceText).not.toHaveBeenCalled();
    });

    it('denies rather than hangs on the export endpoint', async () => {
      const response = mockResponse();
      response.end = jest.fn();
      response.write = jest.fn().mockReturnValue(true);

      await controller.exportMallData(request({}, {}, undefined), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(mallExportService.export).not.toHaveBeenCalled();
      expect(response.write).not.toHaveBeenCalled();
    });

    it('answers every staff endpoint rather than leaving any unanswered', async () => {
      const responses = [mockResponse(), mockResponse(), mockResponse()];
      responses[2].end = jest.fn();
      responses[2].write = jest.fn().mockReturnValue(true);

      await controller.getObjectInspection(request({ id: '1' }, {}, undefined), responses[0]);
      await controller.getObjectSource(request({ id: '1' }, {}, undefined), responses[1]);
      await controller.exportMallData(request({}, {}, undefined), responses[2]);

      responses.forEach(response => {
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalled();
      });
    });
  });

  describe('getObjectInspection', () => {
    it('returns 200 with the inspection for a Mall staff member', async () => {
      const response = mockResponse();
      mallInspectionService.inspect.mockResolvedValue(INSPECTION as never);

      await controller.getObjectInspection(request({ id: '3339' }), response);

      expect(mallInspectionService.inspect).toHaveBeenCalledWith(3339);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({ status: 'success', inspection: INSPECTION });
    });

    it('denies an ordinary member and never reaches the service', async () => {
      const response = mockResponse();
      mallService.canAdmin.mockResolvedValue(false);

      await controller.getObjectInspection(request({ id: '3339' }), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Invalid or missing token or access denied.',
      });
      expect(mallInspectionService.inspect).not.toHaveBeenCalled();
    });

    it('denies a request with no valid token and never reaches the service', async () => {
      const response = mockResponse();
      memberService.decodeMemberToken.mockReturnValue(null as never);

      await controller.getObjectInspection(request({ id: '3339' }, {}, undefined), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(mallService.canAdmin).not.toHaveBeenCalled();
      expect(mallInspectionService.inspect).not.toHaveBeenCalled();
    });

    it('returns 404 for an object that does not exist', async () => {
      const response = mockResponse();
      mallInspectionService.inspect.mockResolvedValue(null as never);

      await controller.getObjectInspection(request({ id: '999999' }), response);

      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for a non-numeric id without touching the service', async () => {
      const response = mockResponse();

      await controller.getObjectInspection(request({ id: 'not-a-number' }), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(mallInspectionService.inspect).not.toHaveBeenCalled();
    });
  });

  describe('getObjectSource', () => {
    beforeEach(() => {
      mallInspectionService.readSourceText.mockResolvedValue({
        text: '#VRML V2.0 utf8\n',
        error: null,
      } as never);
    });

    it('returns the decoded VRML as UTF-8 plain text with nosniff', async () => {
      const response = mockResponse();

      await controller.getObjectSource(request({ id: '3339' }), response);

      expect(response.headers['Content-Type']).toBe('text/plain; charset=utf-8');
      expect(response.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalledWith('#VRML V2.0 utf8\n');
    });

    it('does not offer a download unless asked', async () => {
      const response = mockResponse();

      await controller.getObjectSource(request({ id: '3339' }), response);

      expect(response.headers['Content-Disposition']).toBeUndefined();
    });

    it('names the download from the object id, never from member-supplied data',
      async () => {
        const response = mockResponse();

        await controller.getObjectSource(request({ id: '3339' }, { download: '1' }), response);

        expect(response.headers['Content-Disposition'])
          .toBe('attachment; filename="object-3339.wrl"');
      });

    it('cannot be made to emit a header containing quotes, CRLF or path characters',
      async () => {
        // The object's own name is member-supplied and is never consulted here, so
        // a hostile name cannot reach the header at all.
        const response = mockResponse();

        await controller.getObjectSource(
          request({ id: '42' }, { download: '1' }),
          response,
        );

        const disposition: string = response.headers['Content-Disposition'];
        expect(disposition).toBe('attachment; filename="object-42.wrl"');
        expect(disposition).not.toMatch(/[\r\n]/);
        expect(disposition.match(/"/g)).toHaveLength(2);
      });

    it('denies an ordinary member and never reads the file', async () => {
      const response = mockResponse();
      mallService.canAdmin.mockResolvedValue(false);

      await controller.getObjectSource(request({ id: '3339' }), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(mallInspectionService.readSourceText).not.toHaveBeenCalled();
      expect(response.send).not.toHaveBeenCalled();
    });

    it('returns 404 when the object or its file is gone', async () => {
      const response = mockResponse();
      mallInspectionService.readSourceText.mockResolvedValue({
        text: null,
        error: 'not_found',
      } as never);

      await controller.getObjectSource(request({ id: '3339' }), response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.send).not.toHaveBeenCalled();
    });

    it('returns 422 with the reason when the file cannot be decoded', async () => {
      const response = mockResponse();
      mallInspectionService.readSourceText.mockResolvedValue({
        text: null,
        error: 'gzip_corrupt',
      } as never);

      await controller.getObjectSource(request({ id: '3339' }), response);

      expect(response.status).toHaveBeenCalledWith(422);
      expect(response.json).toHaveBeenCalledWith({ error: 'gzip_corrupt' });
    });

    it('returns 400 for a non-numeric id without reading anything', async () => {
      const response = mockResponse();

      await controller.getObjectSource(request({ id: 'nope' }), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(mallInspectionService.readSourceText).not.toHaveBeenCalled();
    });
  });

  describe('exportMallData', () => {
    function streamingResponse() {
      const response = mockResponse();
      response.end = jest.fn();
      response.write = jest.fn().mockReturnValue(true);
      response.once = jest.fn();
      return response;
    }

    it('streams for a Mall staff member and closes the response', async () => {
      const response = streamingResponse();
      mallExportService.export.mockResolvedValue('complete' as never);

      await controller.exportMallData(request({}, {}), response);

      expect(mallExportService.export).toHaveBeenCalledTimes(1);
      expect(response.headers['Content-Type']).toBe('application/json; charset=utf-8');
      expect(response.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.end).toHaveBeenCalled();
    });

    it('defaults to the cheap mode, with no WRL reads', async () => {
      const response = streamingResponse();
      mallExportService.export.mockResolvedValue('complete' as never);

      await controller.exportMallData(request({}, {}), response);

      expect(mallExportService.export.mock.calls[0][1])
        .toEqual(expect.objectContaining({ includeDerived: false }));
    });

    it('opts into derived metadata only when explicitly asked', async () => {
      const response = streamingResponse();
      mallExportService.export.mockResolvedValue('complete' as never);

      await controller.exportMallData(request({}, { derived: '1' }), response);

      expect(mallExportService.export.mock.calls[0][1])
        .toEqual(expect.objectContaining({ includeDerived: true }));
    });

    it('denies an ordinary member before a single byte is written', async () => {
      const response = streamingResponse();
      mallService.canAdmin.mockResolvedValue(false);

      await controller.exportMallData(request({}, {}), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(mallExportService.export).not.toHaveBeenCalled();
      expect(response.write).not.toHaveBeenCalled();
      expect(response.end).not.toHaveBeenCalled();
    });

    it('still closes the response when the export throws', async () => {
      const response = streamingResponse();
      mallExportService.export.mockRejectedValue(new Error('boom') as never);

      await controller.exportMallData(request({}, {}), response);

      expect(response.end).toHaveBeenCalled();
    });

    it('captures the export deadline before preflight runs, and threads it through',
      async () => {
        const response = streamingResponse();
        mallExportService.export.mockResolvedValue('complete' as never);
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

        await controller.exportMallData(request({}, {}), response);

        expect(mallExportService.export.mock.calls[0][1]).toEqual(
          expect.objectContaining({ startedAt: 1_000_000 }),
        );

        nowSpy.mockRestore();
      });

    it('fails safely, before the response starts, when preflight alone exhausts the budget',
      async () => {
        const response = streamingResponse();
        let now = 0;
        const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
        // Simulates preflight itself taking longer than the whole export
        // budget: nothing has counted against MAX_DURATION_MS until now, so a
        // clock reset here would give the streaming body a fresh budget on
        // top of it.
        mallExportService.preflight.mockImplementation(async () => {
          now = MAX_DURATION_MS + 1;
          return {} as never;
        });

        await controller.exportMallData(request({}, {}), response);

        expect(response.status).toHaveBeenCalledWith(503);
        expect(response.json).toHaveBeenCalledWith({ error: EXPORT_ERROR_CODES.budgetExceeded });
        expect(mallExportService.export).not.toHaveBeenCalled();
        expect(response.write).not.toHaveBeenCalled();
        expect(response.end).not.toHaveBeenCalled();

        nowSpy.mockRestore();
      });
  });

  describe('object id validation - the whole parameter, not a prefix of it', () => {
    const REJECTED = ['3339x', '3339-not-an-id', '12.5', '-1', '0', '', 'abc'];

    it('rejects anything that is not wholly a positive integer, for inspection', async () => {
      for (const id of REJECTED) {
        const response = mockResponse();

        await controller.getObjectInspection(request({ id }), response);

        expect(response.status).toHaveBeenCalledWith(400);
      }
      expect(mallInspectionService.inspect).not.toHaveBeenCalled();
    });

    it('rejects anything that is not wholly a positive integer, for source', async () => {
      for (const id of REJECTED) {
        const response = mockResponse();

        await controller.getObjectSource(request({ id }), response);

        expect(response.status).toHaveBeenCalledWith(400);
      }
    });

    it('still accepts an ordinary id', async () => {
      const response = mockResponse();

      await controller.getObjectInspection(request({ id: '3339' }), response);

      expect(response.status).not.toHaveBeenCalledWith(400);
      expect(mallInspectionService.inspect).toHaveBeenCalledWith(3339);
    });
  });

  describe('rejectObject - the uploader is told why', () => {
    const OBJECT = {
      id: 3339,
      name: 'Celestial Windchime1',
      member_id: 42,
      quantity: 25,
      price: 75,
      status: 2,
    };

    function rejectRequest(body: { [key: string]: unknown } = {}): MockRequest {
      return {
        headers: { apitoken: 'staff-token' },
        body: { id: '3339', reason: 'WorldInfo says unlimited, the Mall limit says 25.', ...body },
      } as unknown as MockRequest;
    }

    beforeEach(() => {
      objectService.findById.mockResolvedValue({ ...OBJECT } as never);
      objectService.getSellerFee.mockReturnValue(100 as never);
      // The refund, the status change and the concurrency guard now live inside
      // one transaction in ObjectService, proven against a real database in
      // object.service.atomic.spec.ts. What is left to prove here is that the
      // controller maps each outcome to the right response, and only notifies
      // after a rejection actually committed.
      objectService.rejectPendingObject.mockResolvedValue(
        { outcome: ObjectService.REJECT_REJECTED, object: { ...OBJECT } } as never,
      );
      placeRepository.findHomeByMemberId.mockResolvedValue({ id: 909 } as never);
      inboxService.sanitize.mockImplementation((value: string) => Promise.resolve(value) as never);
      inboxService.postInboxMessage.mockResolvedValue(undefined as never);
    });

    it('refuses a blank reason without touching the object', async () => {
      const response = mockResponse();

      await controller.rejectObject(rejectRequest({ reason: '' }), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(objectService.rejectPendingObject).not.toHaveBeenCalled();
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });

    it('refuses a whitespace-only reason', async () => {
      const response = mockResponse();

      await controller.rejectObject(rejectRequest({ reason: '   \n\t  ' }), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(objectService.rejectPendingObject).not.toHaveBeenCalled();
    });

    it('refuses a reason longer than the accepted maximum rather than truncating', async () => {
      const response = mockResponse();

      await controller.rejectObject(rejectRequest({ reason: 'x'.repeat(2001) }), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(objectService.rejectPendingObject).not.toHaveBeenCalled();
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });

    it('completes the rejection before reporting success', async () => {
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      expect(objectService.rejectPendingObject).toHaveBeenCalledWith(3339);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({ status: 'success', notified: true });
    });

    it('refuses an object that is not a pending submission', async () => {
      objectService.rejectPendingObject.mockResolvedValue(
        { outcome: ObjectService.REJECT_INVALID_STATE, object: { ...OBJECT } } as never,
      );
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      // Staff authorisation is not a licence to refund a stocked object because
      // a stale page asked for it.
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Only a pending object can be rejected.',
      });
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });

    it('refuses an object id that does not exist', async () => {
      objectService.rejectPendingObject.mockResolvedValue(
        { outcome: ObjectService.REJECT_NOT_FOUND, object: null } as never,
      );
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });

    it('reports no success and sends no notice when the transaction fails', async () => {
      objectService.rejectPendingObject
        .mockRejectedValue(new Error('deadlock') as never);
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      // The transaction rolled back, so nothing was refunded and nothing was
      // rejected; telling the uploader anything would be a lie.
      expect(response.status).not.toHaveBeenCalledWith(200);
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });

    it('sends exactly one notice, to the uploader home, with the generated subject', async () => {
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      expect(placeRepository.findHomeByMemberId).toHaveBeenCalledWith(42);
      expect(inboxService.postInboxMessage).toHaveBeenCalledTimes(1);
      expect(inboxService.postInboxMessage).toHaveBeenCalledWith(
        7,
        909,
        'rejected - Celestial Windchime1',
        'WorldInfo says unlimited, the Mall limit says 25.',
      );
    });

    it('ignores a recipient, subject or object name supplied by the browser', async () => {
      const response = mockResponse();

      await controller.rejectObject(rejectRequest({
        recipient: 1,
        member_id: 1,
        place_id: 1,
        subject: 'rejected - something else',
        name: 'Spoofed Name',
      }), response);

      expect(placeRepository.findHomeByMemberId).toHaveBeenCalledWith(42);
      expect(inboxService.postInboxMessage).toHaveBeenCalledWith(
        7,
        909,
        'rejected - Celestial Windchime1',
        expect.any(String),
      );
    });

    it('trims the reason it delivers', async () => {
      const response = mockResponse();

      const padded = rejectRequest({ reason: '  please fix the price  ' });
      await controller.rejectObject(padded, response);

      expect(inboxService.postInboxMessage).toHaveBeenCalledWith(
        7, 909, expect.any(String), 'please fix the price',
      );
    });

    it('keeps a punctuated or unicode object name intact but never lets it break the subject',
      async () => {
        objectService.rejectPendingObject.mockResolvedValue({
          outcome: ObjectService.REJECT_REJECTED,
          object: { ...OBJECT, name: 'Café "Deluxe" — v2\nInjected' },
        } as never);
        const response = mockResponse();

        await controller.rejectObject(rejectRequest(), response);

        const subject = inboxService.postInboxMessage.mock.calls[0][2] as string;
        expect(subject).toBe('rejected - Café "Deluxe" — v2 Injected');
        expect(subject).not.toMatch(/[\r\n]/);
      });

    it('still rejects the object when the uploader can no longer be notified', async () => {
      placeRepository.findHomeByMemberId.mockResolvedValue(undefined as never);
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      expect(objectService.rejectPendingObject).toHaveBeenCalledWith(3339);
      expect(response.json).toHaveBeenCalledWith({ status: 'success', notified: false });
    });

    it('does not claim a notification that the inbox refused', async () => {
      inboxService.postInboxMessage.mockRejectedValue(new Error('inbox down') as never);
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      // Reported honestly rather than as a 500: the refund already happened and
      // a retry would repeat it.
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({ status: 'success', notified: false });
    });

    it('does not refund or notify twice when the object is already rejected', async () => {
      objectService.rejectPendingObject.mockResolvedValue(
        {
          outcome: ObjectService.REJECT_ALREADY_REJECTED,
          object: { ...OBJECT, status: 0 },
        } as never,
      );
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(
        { status: 'success', notified: false, alreadyRejected: true },
      );
    });

    it('denies a member who is not Mall staff before reading the object', async () => {
      mallService.canAdmin.mockResolvedValue(false as never);
      const response = mockResponse();

      await controller.rejectObject(rejectRequest(), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(objectService.rejectPendingObject).not.toHaveBeenCalled();
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });
  });

  describe('approveObject - the uploader is told it was accepted', () => {
    const OBJECT = {
      id: 3339,
      name: 'Celestial Windchime1',
      member_id: 42,
      quantity: 25,
      price: 75,
      status: 2,
    };

    function approveRequest(body: { [key: string]: unknown } = {}): MockRequest {
      return {
        headers: { apitoken: 'staff-token' },
        body: { objectId: '3339', ...body },
      } as unknown as MockRequest;
    }

    beforeEach(() => {
      objectService.approvePendingObject.mockResolvedValue(
        { outcome: ObjectService.REJECT_REJECTED, object: { ...OBJECT } } as never,
      );
      placeRepository.findHomeByMemberId.mockResolvedValue({ id: 909 } as never);
      inboxService.sanitize.mockImplementation((value: string) => Promise.resolve(value) as never);
      inboxService.postInboxMessage.mockResolvedValue(undefined as never);
    });

    it('sends exactly one notice, to the uploader home, with the generated subject',
      async () => {
        const response = mockResponse();

        await controller.approveObject(approveRequest(), response);

        expect(placeRepository.findHomeByMemberId).toHaveBeenCalledWith(42);
        expect(inboxService.postInboxMessage).toHaveBeenCalledTimes(1);

        const [sender, place, subject, body] = inboxService.postInboxMessage.mock.calls[0];
        expect(sender).toBe(7);
        expect(place).toBe(909);
        expect(subject).toBe('accepted - Celestial Windchime1');
        expect(body).toContain('Celestial Windchime1');
        expect(body).toContain('Coming Soon');
        expect(body).toContain('Warehouse');
        // No calendar date is invented: there is no authoritative next-drop
        // date in this workflow, so the notice must not promise one.
        expect(body).not.toMatch(/\b(19|20)\d\d\b/);
        expect(response.json).toHaveBeenCalledWith({ status: 'success', notified: true });
      });

    it('ignores a recipient, subject or object name supplied by the browser', async () => {
      const response = mockResponse();

      await controller.approveObject(approveRequest({
        member_id: 1,
        place_id: 1,
        subject: 'accepted - something else',
        name: 'Something Else',
      }), response);

      expect(inboxService.postInboxMessage).toHaveBeenCalledWith(
        7,
        909,
        'accepted - Celestial Windchime1',
        expect.any(String),
      );
    });

    it('keeps control characters in a stored name out of the subject line', async () => {
      objectService.approvePendingObject.mockResolvedValue(
        {
          outcome: ObjectService.REJECT_REJECTED,
          object: { ...OBJECT, name: 'Wind\r\nchime\tTwo' },
        } as never,
      );
      const response = mockResponse();

      await controller.approveObject(approveRequest(), response);

      const subject = inboxService.postInboxMessage.mock.calls[0][2] as string;
      expect(subject).toBe('accepted - Wind chime Two');
    });

    it('refuses an object that is not a pending submission, and notifies no one', async () => {
      objectService.approvePendingObject.mockResolvedValue(
        { outcome: ObjectService.REJECT_INVALID_STATE, object: { ...OBJECT } } as never,
      );
      const response = mockResponse();

      await controller.approveObject(approveRequest(), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });

    it('refuses an object id that does not exist, and notifies no one', async () => {
      objectService.approvePendingObject.mockResolvedValue(
        { outcome: ObjectService.REJECT_NOT_FOUND, object: null } as never,
      );
      const response = mockResponse();

      await controller.approveObject(approveRequest(), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });

    it('sends no notice when the transition itself failed', async () => {
      objectService.approvePendingObject.mockRejectedValue(new Error('deadlock') as never);
      const response = mockResponse();

      await controller.approveObject(approveRequest(), response);

      // Nothing moved, so telling the uploader their item was accepted would
      // be a lie.
      expect(response.status).not.toHaveBeenCalledWith(200);
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });

    it('does not roll the acceptance back when the notice cannot be delivered', async () => {
      inboxService.postInboxMessage.mockRejectedValue(new Error('inbox down') as never);
      const response = mockResponse();

      await controller.approveObject(approveRequest(), response);

      // Reported honestly rather than as a 500: the transition already
      // committed and a retry would answer with a bare success.
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({ status: 'success', notified: false });
    });

    it('reports notified:false when the uploader has no home to deliver to', async () => {
      placeRepository.findHomeByMemberId.mockResolvedValue(undefined as never);
      const response = mockResponse();

      await controller.approveObject(approveRequest(), response);

      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith({ status: 'success', notified: false });
    });

    it('does not notify twice when a concurrent Accept already won the race', async () => {
      objectService.approvePendingObject.mockResolvedValue(
        {
          outcome: ObjectService.REJECT_ALREADY_REJECTED,
          object: { ...OBJECT, status: 3 },
        } as never,
      );
      const response = mockResponse();

      await controller.approveObject(approveRequest(), response);

      // This request performed no transition, so it must not send a second
      // acceptance notice for the one acceptance that did happen.
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(
        { status: 'success', notified: false, alreadyAccepted: true },
      );
    });

    it('denies a member who is not Mall staff before touching the object', async () => {
      mallService.canAdmin.mockResolvedValue(false as never);
      const response = mockResponse();

      await controller.approveObject(approveRequest(), response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(objectService.approvePendingObject).not.toHaveBeenCalled();
      expect(inboxService.postInboxMessage).not.toHaveBeenCalled();
    });
  });
});
