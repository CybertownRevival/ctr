import { Service } from 'typedi';

import { Db } from '../../db/db.class';

/** Repository for fetching/interacting with virtual pet data in the database. */
@Service()
export class VirtualPetRepository {
  constructor(private db: Db) {}

  public async addVirtualPet(placeId: number, behaviours: string): Promise<any> {
    return await this.db.knex('virtual_pet')
      .insert({place_id: placeId, pet_behaviours: behaviours});
  }
  
  public async getVirtualPet(placeId: number): Promise<any> {
    const pet = await this.db.knex('virtual_pet')
      .where('place_id', placeId);
    return pet;
  }

  public async updateVirtualPet(
    placeId: number, 
    name: string, 
    avatar: string, 
    active: boolean, 
    voice: number, 
    behaviours: string): Promise<any> {
    return await this.db.knex('virtual_pet')
      .update({
        pet_name: name,
        pet_avatar_url: avatar,
        active: active,
        pet_voice_id: voice,
        pet_behaviours: behaviours,
      })
      .where('place_id', placeId);
  }

  
}
