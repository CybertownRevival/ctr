import { Service } from 'typedi';
import { Avatar } from 'models';

import {
  AvatarRepository,
} from '../../repositories';

/** Service for dealing with avatars */
@Service()
export class AvatarService {
  constructor(
    private avatarRepository: AvatarRepository,
  ) {}


  /**
   * Finds all avatars
   * @returns promise resolving all avatars object, or rejecting on error
   */
  public async findAll(): Promise<Avatar[]> {
    return await this.avatarRepository.findAll();
  }
}
