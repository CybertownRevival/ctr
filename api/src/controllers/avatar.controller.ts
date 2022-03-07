import { Request, Response} from 'express';

import { db } from '../db';

interface QueryParams {
  limit: string,
  order: string,
  orderDirection: string,
}
class AvatarController {
  public static readonly MAX_LIMIT = 1000;
  public static readonly VALID_ORDERS = ['id'];
  public static readonly VALID_ORDER_DIRECTIONS = ['asc', 'desc'];

  constructor() {}

  /**
   * Returns an ordered list of all avatars.
   */
  public async getResults(request: Request, response: Response): Promise<void> {
    const { limit, order, orderDirection }: QueryParams = (<QueryParams> (<unknown> request.query));
    const parsedLimit = parseInt(<string> limit);

    const queryLimit = (parsedLimit <= AvatarController.MAX_LIMIT)
      ? parsedLimit
      : 10;

    const orderBy = AvatarController.VALID_ORDERS.includes(order)
      ? order
      : 'id';

    const queryOrderDirection = AvatarController.VALID_ORDER_DIRECTIONS.includes(orderDirection)
      ? orderDirection
      : '';
    
    try {
      const avatars = await db.avatar.getAll(orderBy, queryOrderDirection, queryLimit);
      response.status(200).json({ avatars });
    } catch (error) {
      response.status(400).json({
        error: 'A problem occurred while trying to fetch avatars.',
      });
    }
  }
}
export const avatarController = new AvatarController();
