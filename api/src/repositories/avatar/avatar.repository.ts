import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Avatar } from 'models';

/** Repository for fetching/interacting with avatar data in the database. */
@Service()
export class AvatarRepository {

  constructor(private db: Db) {}

  /**
   * Finds an avatar with the given search parameters if one exists.
   * @param avatarSearchParams object containing properties of an avatar for searching on
   * @returns promise resolving in the found avatar object, or rejecting on error
   * Finds all avatars
   * @returns promise resolving in the found avatars object, or rejecting on error
   */
  public async find(avatarSearchParams: Partial<Avatar>): Promise<Avatar> {
    const [avatar] = await this.db.avatar.where(avatarSearchParams);
    return avatar;
  }

  /**
   * Finds all avatars
   * @returns promise resolving in the found avatars object, or rejecting on error
   */
  public async findAll(): Promise<Avatar[]> {
    return this.db.avatar.where({'status': 1});
  }
}
