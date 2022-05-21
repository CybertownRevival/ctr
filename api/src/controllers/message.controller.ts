import { Request, Response} from 'express';
import validator from 'validator';

import { db } from '../db';
import { member } from '../libs';

interface QueryParams {
  limit: string,
  order: string,
  orderDirection: string,
}

class MessageController {
  public static readonly MAX_QUERY_LIMIT = 1000;
  public static readonly VALID_ORDERS = ['id'];
  public static readonly VALID_ORDER_DIRECTIONS = ['asc', 'desc'];

  constructor() {}

  /** Handles storing a user message to the database */
  public async addMessage(request: Request, response: Response): Promise<void> {
    const token = member.decryptToken(<string> request.headers.apitoken);
    if(!token) {
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
        error: 'body is required.',
      });
      return;
    }
    
    try {
      const { id } = token;
      const { body } = request.body;
      const placeId = Number.parseInt(request.params.placeId);
      const messageId = await db.message.add(id, placeId, body);
      response.status(200).json({ messageId });
    } catch (error) {
      response.status(400).json({
        error: 'A problem occurred creating message.',
      });
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
      : '';
    try {
      const messages = await db.message.byPlaceId(placeId, queryOrder, queryOrderDirection,
        queryLimit);
      response.status(200).json({ messages });
    } catch (error) {
      response.status(400).json({
        error: 'A problem occurred while trying to fetch messages.',
      });
    }
  }
}
export const messageController = new MessageController();
