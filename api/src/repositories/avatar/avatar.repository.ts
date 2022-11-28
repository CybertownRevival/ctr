import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Avatar } from 'models';

/** Class for interacting with the avatar database table */
@Service()
export class AvatarRepository {

  constructor(private db: Db) {}


  /**
   * Finds an avatar with the given search parameters if one exists.
   * @param avatarSearchParams object containing properties of an avatar for searching on
   * @returns promise resolving in the found avatar object, or rejecting on error
   */
  public async find(avatarSearchParams: Partial<Avatar>): Promise<Avatar> {
    const [avatar] = await this.db.avatar.where(avatarSearchParams);
    return avatar;
  }
}
