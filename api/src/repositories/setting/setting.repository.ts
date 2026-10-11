import { Service } from 'typedi';

import { Db } from '../../db/db.class';

/** Repository for fetching/interacting with site wide settings in the database. */
@Service()
export class SettingRepository {
  constructor(private db: Db) {}

  public async get(name: string): Promise<string | null> {
    const setting = await this.db.setting.where({ name }).first();
    return setting ? setting.value : null;
  }

  public async set(name: string, value: string): Promise<void> {
    await this.db.setting
      .insert({ name, value })
      .onConflict('name')
      .merge({ value, updated_at: this.db.knex.fn.now() });
  }
}
