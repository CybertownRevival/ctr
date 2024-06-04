import { Knex, knex as _knex } from 'knex';
import { Service } from 'typedi';

import config from '../knexfile';
import * as Models from 'models';

/** Class for providing knex query builders for each table in the database. */
@Service()
export class Db {
  public knex: Knex;

  constructor() {
    this.knex = _knex(config[process.env.NODE_ENV]);
  }

  get avatar() {
    return this.knex<Models.Avatar, Models.Avatar[]>('avatar');
  }
  get home() {
    return this.knex<Models.Home, Models.Home[]>('home');
  }
  get mallObject() {
    return this.knex<Models.MallObject, Models.MallObject[]>('mall_object');
  }
  get mapLocation() {
    return this.knex<Models.MapLocation, Models.MapLocation[]>('map_location');
  }
  get member() {
    return this.knex<Models.Member, Models.Member[]>('member');
  }
  get message() {
    return this.knex<Models.Message, Models.Message[]>('message');
  }
  get object() {
    return this.knex<Models.Object, Models.Object[]>('object');
  }
  get objectInstance() {
    return this.knex<Models.ObjectInstance, Models.ObjectInstance[]>('object_instance');
  }
  get place() {
    return this.knex<Models.Place, Models.Place[]>('place');
  }
  get role() {
    return this.knex<Models.Role, Models.Role[]>('role');
  }
  get roleAssignment() {
    return this.knex<Models.RoleAssignment, Models.RoleAssignment[]>('role_assignment');
  }
  get transaction() {
    return this.knex<Models.Transaction, Models.Transaction[]>('transaction');
  }
  get wallet() {
    return this.knex<Models.Wallet, Models.Wallet[]>('wallet');
  }
}
