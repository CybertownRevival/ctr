import { Service } from 'typedi';

import { Db } from '../../db/db.class';

@Service()
export class LiveEventRepository {
  constructor(private db: Db) {}

  public async getCurrent(): Promise<any> {
    return this.db.knex('live_event')
      .where({ id: 1 })
      .first();
  }

  public async update(
    placeId: number | null,
    enabled: boolean,
    updatedBy: number,
  ): Promise<void> {
    await this.db.knex('live_event')
      .where({ id: 1 })
      .update({
        place_id: placeId,
        enabled,
        updated_by: updatedBy,
        updated_at: new Date(),
      });
  }
}
