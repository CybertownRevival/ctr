import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { knex } from '../../db';
import { Place } from '../../types/models';

@Service()
export class ColonyRepository {
  constructor(private db: Db) {}

  public async find(colonyId: number): Promise<Place> {
    return this.db.place.where({ type: 'colony', id: colonyId }).first();
  }
  
  public async getAccessInfoByUsername(
    colonyId,
    ownerCode,
    deputyCode): Promise<{ owner: any[]; deputies: any[] }> {
    const owner: any[] = await this.db.knex
      .select(
        'member.username',
      )
      .from('role_assignment')
      .where('role_assignment.place_id', colonyId)
      .where('role_assignment.role_id', ownerCode)
      .innerJoin('member', 'role_assignment.member_id', 'member.id');
    const deputies: any[] = await this.db.knex
      .select(
        'member.username',
      )
      .from('role_assignment')
      .where('role_assignment.place_id', colonyId)
      .where('role_assignment.role_id', deputyCode)
      .innerJoin('member', 'role_assignment.member_id', 'member.id');
    return {deputies, owner};
  }
  
  public async getAccessInfoByID(
    colonyId,
    ownerCode,
    deputyCode): Promise<{ owner: any[]; deputies: any[] }> {
    const owner: any[] = await this.db.knex
      .select(
        'member_id',
      )
      .from('role_assignment')
      .where('place_id', colonyId)
      .where('role_id', ownerCode);
    const deputies: any[] = await this.db.knex
      .select(
        'member_id',
      )
      .from('role_assignment')
      .where('place_id', colonyId)
      .where('role_id', deputyCode);
    return {deputies, owner};
  }

  public async getHoods(colonyId: number): Promise<any> {
    return this.db.knex
      .select('place.id', 'place.name', 'map_location.location')
      .from('place')
      .innerJoin('map_location', 'map_location.place_id', 'place.id')
      .innerJoin('place as colony', 'map_location.parent_place_id', 'colony.id')
      .where('colony.id', colonyId)
      .orderBy('map_location.location');
  }
  
  public async addIdToAssignment(
    colonyId: number,
    memberId: number,
    roleId: number,
  ): Promise<any> {
    return this.db.knex('role_assignment')
      .insert(
        {
          role_id: roleId,
          member_id: memberId,
          place_id: colonyId,
        },
      );
  }
  
  public async removeIdFromAssignment(
    colonyId: number,
    memberId: number,
    roleId: number,
  ): Promise<any> {
    return this.db.knex('role_assignment')
      .where('place_id', colonyId)
      .where('member_id', memberId)
      .where('role_id', roleId)
      .del();
  }
}
