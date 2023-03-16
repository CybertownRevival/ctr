import { Service } from 'typedi';

import {
  MessageRepository,
} from '../../repositories';
import {Message} from 'models';

/** Service for dealing with messages */
@Service()
export class MessageService {
  public static readonly MAX_QUERY_LIMIT = 1000;
  public static readonly VALID_ORDERS = ['id'];
  public static readonly VALID_ORDER_DIRECTIONS = ['asc', 'desc'];

  constructor(
    private messageRepository: MessageRepository,
  ) {}

  public async create(
    memberId: number,
    placeId: number,
    messageBody: string,
    status: number,
  ): Promise<number> {
    return await this.messageRepository.create(memberId, placeId, messageBody, status);
  }

  public async getResults(
    placeId: number,
    orderField: string,
    orderDirection: string,
    limit:number,
  ): Promise<any> {
    const queryLimit = (limit > 0 && limit <= MessageService.MAX_QUERY_LIMIT)
      ? limit
      : 10;
    const queryOrder = MessageService.VALID_ORDERS.includes(orderField)
      ? orderField
      : 'id';
    const queryOrderDirection = MessageService.VALID_ORDER_DIRECTIONS.includes(orderDirection)
      ? orderDirection
      : 'desc';

    return await this.messageRepository.getResults(
      placeId,
      queryOrder,
      queryOrderDirection,
      queryLimit,
    );
  }


}
