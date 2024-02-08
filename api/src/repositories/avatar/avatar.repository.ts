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

  /**
   * gets all the avatars a memberId can access
   * @param memberId 
   * @returns 
   */
  public async findAllForMemberId(memberId): Promise<Avatar[]> {
    return this.db.avatar.where({
      status: 1,
    })
    .andWhere((builder) => {
      builder.where({private: 0})
      .orWhere({private: 1, member_id: memberId})
    });
  }

  /**
   *
   * @param directory
   * @param fileName
   * @param image
   * @param name
   * @param gestures
   * @param privateStatus
   * @param memberId
   * @returns
   */
  public async create(
    directory: string,
    fileName: string,
    image: string,
    name: string,
    gestures: string,
    privateStatus: number,
    memberId: number,
    status: number
  ): Promise<number> {
    const [avatar] = await this.db.avatar.insert({
      directory: directory,
      filename: fileName,
      image: image,
      name: name,
      gestures: gestures,
      private: privateStatus,
      member_id: memberId,
      status: status
    });

    return avatar;
  }
}
