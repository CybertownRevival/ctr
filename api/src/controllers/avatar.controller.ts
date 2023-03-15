import { Request, Response} from 'express';
import {Container} from 'typedi';

import {
  AvatarService,
} from '../services';


class AvatarController {

  constructor(
    private avatarService: AvatarService,
  ) {}

  /**
   * Returns an ordered list of all avatars.
   */
  public async getResults(request: Request, response: Response): Promise<void> {
    try {
      const avatars = await this.avatarService.findAll();
      response.status(200).json({ avatars });
    } catch (error) {
      console.error(error);
      response.status(400).json({
        error: 'A problem occurred while trying to fetch avatars.',
      });
    }
  }
}
const avatarService = Container.get(AvatarService);
export const avatarController = new AvatarController(avatarService);
