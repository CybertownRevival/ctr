
import { Request, Response } from 'express';
import { HoodService, MemberService } from '../services';
import { Container } from 'typedi';

class HoodController {
  constructor(
    private hoodService: HoodService,
    private memberService: MemberService,
  ) {}

  public async getHood(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { id } = request.params;

    try {
      const hood = await this.hoodService.find(parseInt(id, 10));
      const colony = await this.hoodService.getColony(parseInt(id, 10));

      response.status(200).json({
        hood: hood,
        colony: colony,
      });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getBlocks(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { id } = request.params;

    try {
      const blocks = await this.hoodService.getBlocks(parseInt(id, 10));
      response.status(200).json({ blocks });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getAccessInfoByUsername(
    request: Request,
    response: Response,
  ): Promise<any> {
    const { id } = request.params;

    try {
      const data = await this.hoodService.getAccessInfoByUsername(
        parseInt(id, 10),
      );

      response.status(200).json({ data });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async postAccessInfo(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { apitoken } = request.headers;

    let session;

    try {
      if (typeof apitoken !== 'string' || !apitoken) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      try {
        session = this.memberService.decodeMemberToken(apitoken);
      } catch (error) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      if (!session) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      const hoodId = Number(request.params.id);

      if (!Number.isSafeInteger(hoodId) || hoodId <= 0) {
        response.status(400).json({
          error: 'Invalid neighbourhood.',
        });
        return;
      }

      const access = await this.hoodService.canManageAccess(
        hoodId,
        session.id,
      );

      if (!access) {
        response.status(403).json({
          error: 'Access Denied',
        });
        return;
      }

      const deputies = request.body.deputies;
      const owner = request.body.owner;

      await this.hoodService.postAccessInfo(
        hoodId,
        deputies,
        owner,
      );

      response.status(200).json({ success: true });
    } catch (error) {
      console.error('Failed to update neighbourhood access', error);
      response.status(500).json({
        error: 'Failed to update neighbourhood access.',
      });
    }
  }

  public async canAdmin(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { id } = request.params;
    const { apitoken } = request.headers;

    try {
      if (typeof apitoken !== 'string' || !apitoken) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      let session;

      try {
        session = this.memberService.decodeMemberToken(apitoken);
      } catch (error) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      if (!session) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      const hoodId = Number(id);

      if (!Number.isSafeInteger(hoodId) || hoodId <= 0) {
        response.status(400).json({
          error: 'Invalid neighbourhood.',
        });
        return;
      }

      const allowed = await this.hoodService.canAdmin(
        hoodId,
        session.id,
      );

      if (!allowed) {
        response.status(403).json({ result: false });
        return;
      }

      response.status(200).json({ result: true });
    } catch (error) {
      console.error(error);
      response.status(500).json({
        error: 'Failed to check neighbourhood permissions.',
      });
    }
  }

  public async canRenameBlock(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { id } = request.params;
    const { apitoken } = request.headers;

    try {
      if (typeof apitoken !== 'string' || !apitoken) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      let session;

      try {
        session = this.memberService.decodeMemberToken(apitoken);
      } catch (error) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      if (!session) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      const hoodId = Number(id);

      if (!Number.isSafeInteger(hoodId) || hoodId <= 0) {
        response.status(400).json({
          error: 'Invalid neighbourhood.',
        });
        return;
      }

      const allowed = await this.hoodService.canRenameBlock(
        hoodId,
        session.id,
      );

      response.status(200).json({
        result: allowed,
      });
    } catch (error) {
      console.error('Failed to check block rename permissions', error);

      response.status(500).json({
        error: 'Failed to check block rename permissions.',
      });
    }
  }

  public async canManageAccess(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { id } = request.params;
    const { apitoken } = request.headers;

    try {
      if (typeof apitoken !== 'string' || !apitoken) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      let session;

      try {
        session = this.memberService.decodeMemberToken(apitoken);
      } catch (error) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      if (!session) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      const hoodId = Number(id);

      if (!Number.isSafeInteger(hoodId) || hoodId <= 0) {
        response.status(400).json({
          error: 'Invalid neighbourhood.',
        });
        return;
      }

      const allowed = await this.hoodService.canManageAccess(
        hoodId,
        session.id,
      );

      if (!allowed) {
        response.status(403).json({
          error: 'Access Denied',
        });
        return;
      }

      response.status(200).json({ isOwner: true });
    } catch (error) {
      console.error(error);
      response.status(500).json({
        error: 'Failed to check access permissions.',
      });
    }
  }

  public async updateBlockStatus(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { apitoken } = request.headers;
    const hoodId = Number(request.params.id);
    const blockId = Number(request.params.blockId);
    const status = request.body && request.body.status;

    try {
      // Check for a missing or invalid authentication token.
      if (typeof apitoken !== 'string' || !apitoken) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      let session;

      try {
        session = this.memberService.decodeMemberToken(apitoken);
      } catch (error) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      if (!session) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      // Only valid neighbourhoods, blocks and statuses are accepted.
      if (
        !Number.isSafeInteger(hoodId) ||
        hoodId <= 0 ||
        !Number.isSafeInteger(blockId) ||
        blockId <= 0 ||
        (status !== 0 && status !== 1)
      ) {
        response.status(400).json({
          error: 'Invalid neighbourhood, block or status.',
        });
        return;
      }

      // Only authorised neighbourhood administrators can proceed.
      const canAdmin = await this.hoodService.canAdmin(
        hoodId,
        session.id,
      );

      if (!canAdmin) {
        response.status(403).json({
          error: 'Access Denied',
        });
        return;
      }

      // Repository verifies that this existing block belongs
      // to the requested neighbourhood before updating it.
      const updated = await this.hoodService.updateBlockStatus(
        hoodId,
        blockId,
        status,
      );

      if (!updated) {
        response.status(404).json({
          error: 'Block not found in this neighbourhood.',
        });
        return;
      }

      response.status(200).json({
        success: true,
        status: status,
      });
    } catch (error) {
      console.error('Failed to update block status', error);
      response.status(500).json({
        error: 'Failed to update block status.',
      });
    }
  }

    public async renameBlock(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { apitoken } = request.headers;
    const hoodId = Number(request.params.id);
    const blockId = Number(request.params.blockId);
    const name = request.body && request.body.name;

    try {
      if (typeof apitoken !== 'string' || !apitoken) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      let session;

      try {
        session = this.memberService.decodeMemberToken(apitoken);
      } catch (error) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      if (!session) {
        response.status(401).json({
          error: 'Invalid or missing token.',
        });
        return;
      }

      if (
        !Number.isSafeInteger(hoodId) ||
        hoodId <= 0 ||
        !Number.isSafeInteger(blockId) ||
        blockId <= 0 ||
        typeof name !== 'string' ||
        name.trim().length === 0 ||
        name.trim().length > 100
      ) {
        response.status(400).json({
          error: 'Invalid neighbourhood, block or name.',
        });
        return;
      }

      const canRename = await this.hoodService.canRenameBlock(
        hoodId,
        session.id,
      );

      if (!canRename) {
        response.status(403).json({
          error: 'You do not have permission to rename blocks.',
        });
        return;
      }

      const renamed = await this.hoodService.renameBlock(
        hoodId,
        blockId,
        name.trim(),
      );

      if (!renamed) {
        response.status(404).json({
          error: 'Block not found in this neighbourhood.',
        });
        return;
      }

      response.status(200).json({
        success: true,
        name: name.trim(),
      });
    } catch (error) {
      console.error('Failed to rename block', error);

      response.status(500).json({
        error: 'Failed to rename block.',
      });
    }
  }
}

const hoodService = Container.get(HoodService);
const memberService = Container.get(MemberService);

export const hoodController = new HoodController(
  hoodService,
  memberService,
);
