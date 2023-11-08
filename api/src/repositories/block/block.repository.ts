import {Service} from 'typedi';

import {Db} from '../../db/db.class';
import {Place} from '../../types/models';

@Service()
export class BlockRepository {
  constructor(private db: Db) {}

  public async find(blockId: number): Promise<Place> {
    return this.db.place.where({ type: 'block', id: blockId }).first();
  }
  
  public async getAccessInfoByUsername(
    blockId,
    ownerCode,
    deputyCode): Promise<{ owner: any[]; deputies: any[] }> {
    const owner: any[] = await this.db.knex
      .select(
        'member.username',
      )
      .from('role_assignment')
      .where('role_assignment.place_id', blockId)
      .where('role_assignment.role_id', ownerCode)
      .innerJoin('member', 'role_assignment.member_id', 'member.id');
    const deputies: any[] = await this.db.knex
      .select(
        'member.username',
      )
      .from('role_assignment')
      .where('role_assignment.place_id', blockId)
      .where('role_assignment.role_id', deputyCode)
      .innerJoin('member', 'role_assignment.member_id', 'member.id');
    return {deputies, owner};
  }
  
  public async getAccessInfoByID(
    blockId,
    ownerCode,
    deputyCode): Promise<{ owner: any[]; deputies: any[] }> {
    const owner: any[] = await this.db.knex
      .select(
        'member_id',
      )
      .from('role_assignment')
      .where('place_id', blockId)
      .where('role_id', ownerCode);
    const deputies: any[] = await this.db.knex
      .select(
        'member_id',
      )
      .from('role_assignment')
      .where('place_id', blockId)
      .where('role_id', deputyCode);
    return {deputies, owner};
  }
  
  public async addIdToAssignment(
    blockId: number,
    memberId: number,
    roleId: number,
  ): Promise<any> {
    return this.db.knex('role_assignment')
      .insert(
        {
          role_id: roleId,
          member_id: memberId,
          place_id: blockId,
        },
      );
  }
  
  public async removeIdFromAssignment(
    blockId: number, 
    memberId: number, 
    roleId: number,
  ): Promise<any> {
    return this.db.knex('role_assignment')
      .where('place_id', blockId)
      .where('member_id', memberId)
      .where('role_id', roleId)
      .del();
  }

  public async getMapLocationAndPlacesByBlockId(blockId: number): Promise<any> {
    const locations = await this.db.knex
      .select(
        'map_location.location',
        'map_location.available',
        'place.id',
        'place.name',
        'place.map_icon_index',
        'member.username',
      )
      .from('map_location')
      .leftJoin('place', 'map_location.place_id', 'place.id')
      .leftJoin('member', 'place.member_id', 'member.id')
      .where('map_location.parent_place_id', blockId)
      .orderBy('map_location.location');

    return locations;
  }
}
