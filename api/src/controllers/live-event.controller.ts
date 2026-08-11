import { Request, Response } from 'express';
import { Container, Service } from 'typedi';

import { LiveEventService, MemberService } from '../services';

@Service()
export class LiveEventController {
  constructor(
    private liveEventService: LiveEventService,
    private memberService: MemberService,
  ) {}

  public async getCurrent(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const liveEvent = await this.liveEventService.getCurrent();
      response.status(200).json({ liveEvent });
    } catch (error) {
      console.log(error);
      response.status(400).json({ error });
    }
  }

  public async update(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    const canManage = await this.liveEventService.canManage(session.id);

    if (!canManage) {
      response.status(403).json({ message: 'Access Denied' });
      return;
    }

    const placeId = request.body.placeId === null
      ? null
      : Number.parseInt(request.body.placeId);

    const enabled = request.body.enabled === true;

    if (enabled && !placeId) {
      response.status(400).json({
        message: 'A destination is required when Live Event is enabled.',
      });
      return;
    }

    try {
      await this.liveEventService.update(
        session.id,
        placeId,
        enabled,
      );

      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.log(error);
      response.status(400).json({ error });
    }
  }
}

const liveEventService = Container.get(LiveEventService);
const memberService = Container.get(MemberService);

export const liveEventController = new LiveEventController(
  liveEventService,
  memberService,
);
