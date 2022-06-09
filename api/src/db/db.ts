import { knex as _knex } from 'knex';

import config from '../../knexfile';
import * as Models from 'models';

export const knex = _knex(config[process.env.NODE_ENV]);

/** Object for providing knex query builders for each table in the database. */
export const db = {
  get avatar() {
    return knex<Models.Avatar, Models.Avatar[]>('avatar');
  },
  get member() {
    return knex<Models.Member, Models.Member[]>('member');
  },
  get message() {
    return knex<Models.Message, Models.Message[]>('message');
  },
  get objectInstance() {
    return knex<Models.ObjectInstance, Models.ObjectInstance[]>('object_instance');
  },
  get place() {
    return knex<Models.Place, Models.Place[]>('place');
  },
};
