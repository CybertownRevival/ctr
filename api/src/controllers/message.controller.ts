import { Request, Response} from 'express';
import validator from 'validator';
import { Container, Service } from 'typedi';

import {
  db,
  knex,
} from '../db';
import { Message } from 'models';
import { MemberService } from '../services';

interface QueryParams {
  limit: string,
  order: string,
  orderDirection: string,
}

@Service()
class MessageController {
  public static readonly MAX_QUERY_LIMIT = 1000;
  public static readonly VALID_ORDERS = ['id'];
  public static readonly VALID_ORDER_DIRECTIONS = ['asc', 'desc'];

  constructor(private memberService: MemberService) {}

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
        const [messageId] = await db.message
          .insert({
            body,
            member_id: id,
            place_id: placeId,
            status: 2,
          });
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
        const [messageId] = await db.message
          .insert({
            body,
            member_id: id,
            place_id: placeId,
            status: 1,
          });
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
    const queryLimit = (parsedLimit > 0 && parsedLimit <= MessageController.MAX_QUERY_LIMIT)
      ? parsedLimit
      : 10;
    const queryOrder = MessageController.VALID_ORDERS.includes(order)
      ? order
      : 'id';
    const queryOrderDirection = MessageController.VALID_ORDER_DIRECTIONS.includes(orderDirection)
      ? orderDirection
      : 'desc';
    try {
      const messages = await knex
        .select('message.id', 'message.body as msg', 'member.username as username')
        .from<Message, Message[]>('message')
        .where('message.place_id', placeId)
        .where('message.status', '1')
        .innerJoin('member', 'message.member_id', 'member.id')
        .orderBy(queryOrder, queryOrderDirection)
        .limit(queryLimit);
      response.status(200).json({ messages });
    } catch (error) {
      console.error(error);
      response.status(400).json({
        error: 'A problem occurred while trying to fetch messages.',
      });
    }
  }
}
export const messageController = Container.get(MessageController);
