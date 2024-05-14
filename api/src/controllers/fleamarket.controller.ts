import { Request, Response } from 'express';
import { Container } from 'typedi';

import {
  MemberService,
  FleaMarketService,
} from '../services';

class FleamarketController {
  constructor(
    private memberService: MemberService,
    private fleaMarketService: FleaMarketService,

  ) {}

  public async canAdmin(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.fleaMarketService.canAdmin(session.id))) {
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

  
}
const memberService = Container.get(MemberService);
const fleamarketService = Container.get(FleaMarketService);
export const fleamarketController = new FleamarketController(
  memberService,
  fleamarketService,
);
