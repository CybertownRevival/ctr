import { Request, Response} from 'express';
import validator from 'validator';
import { Container } from 'typedi';

import { MemberService, MessageService } from '../services';

interface QueryParams {
  limit: string,
  order: string,
  orderDirection: string,
}

class MessageController {

  constructor(
    private memberService: MemberService,
    private messageService: MessageService,
  ) {}

  /** Handles storing a user message to the database */
  public async addMessage(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }

    if(parseInt(request.params.placeId) <= 0) {
      response.status(400).json({
        error: 'placeId is required.',
      });
      return;
    }

    if(validator.isEmpty(request.body.body)) {
      response.status(400).json({
        error: 'Message body is required.',
      });
      return;
    }
    const bannedwords = /(nigger)|(chinc)/i;
    if (bannedwords.test(request.body.body)) {
      try {
        const { id } = session;
        const { body } = request.body;
        const placeId = Number.parseInt(request.params.placeId);


        const messageId = await this.messageService.create(
          id,
          placeId,
          body,
          2,
        );

        response.status(200).json({ messageId });
      } catch (error) {
        console.error(error);
        response.status(400).json({
          error: 'A problem occurred creating message.',
        });
      }
    }
    else{
      try {
        const { id } = session;
        const { body } = request.body;
        const placeId = Number.parseInt(request.params.placeId);
        const messageId = await this.messageService.create(
          id,
          placeId,
          body,
          1,
        );
        response.status(200).json({ messageId });
      } catch (error) {
        console.error(error);
        response.status(400).json({
          error: 'A problem occurred creating message.',
        });
      }
    }
  }

  /** Provides an ordered list of messages for the given place */
  public async getResults(request: Request, response: Response): Promise<void> {
    const placeId = Number.parseInt(request.params.placeId);
    if(placeId <= 0) {
      response.status(400).json({
        error: 'placeId is required.',
      });
      return;
    }
    const { limit, order, orderDirection }: QueryParams = (<QueryParams> (<unknown> request.query));
    const parsedLimit = Number.parseInt(limit);
    try {

      const messages = await this.messageService.getResults(
        placeId,
        order,
        orderDirection,
        parsedLimit,
      );
      response.status(200).json({ messages });
    } catch (error) {
      console.error(error);
      response.status(400).json({
        error: 'A problem occurred while trying to fetch messages.',
      });
    }
  }
}
const memberService = Container.get(MemberService);
const messageService = Container.get(MessageService);
export const messageController = new MessageController(memberService, messageService);
