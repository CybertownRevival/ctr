import { Model } from './model';

/** Defines a Fundbox as stored in the database. */
export interface Fundbox extends Model {
  /** ID of the place this Fundbox belongs to. */
  place_id: number;

  /** ID of the wallet holding this Fundbox's CC balance. */
  wallet_id: number;
}
