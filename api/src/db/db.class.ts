import { Knex, knex as _knex } from 'knex';

import config from '../knexfile';
import * as Models from 'models';

/** Class for providing knex query builders for each table in the database. */
export class Db {
  public knex: Knex;

  constructor() {
    this.knex = _knex(config[process.env.NODE_ENV]);
  }

  get avatar() {
    return this.knex<Models.Avatar, Models.Avatar[]>('avatar');
  }
  get member() {
    return this.knex<Models.Member, Models.Member[]>('member');
  }
  get message() {
    return this.knex<Models.Message, Models.Message[]>('message');
  }
  get objectInstance() {
    return this.knex<Models.ObjectInstance, Models.ObjectInstance[]>('object_instance');
  }
  get place() {
    return this.knex<Models.Place, Models.Place[]>('place');
  }
  get mapLocation() {
    return this.knex<Models.MapLocation, Models.MapLocation[]>('map_location');
  }
  get wallet() {
    return this.knex<Models.Wallet, Models.Wallet[]>('wallet');
  }
}
