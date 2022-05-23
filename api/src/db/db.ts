import { knex as _knex } from 'knex';

import config from '../../knexfile';
import * as Models from 'models';

export const knex = _knex(config[process.env.NODE_ENV]);

/** Object containing knex query builders for each table in the database. */
export const db = {
  avatar: knex<Models.Avatar, Models.Avatar[]>('avatar'),
  member: knex<Models.Member, Models.Member[]>('member'),
  message: knex<Models.Message, Models.Message[]>('message'),
  objectInstance: knex<Models.ObjectInstance, Models.ObjectInstance[]>('object_instance'),
  place: knex<Models.Place, Models.Place[]>('place'),
};
