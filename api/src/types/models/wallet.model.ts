import { Model } from './model';

/** Defines a wallet object as stored in the db */
export interface Wallet extends Model {
  balance: number;
}
