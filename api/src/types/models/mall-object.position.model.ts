import { Model } from './model';

/** Defines an MallObject Position object as stored in the db */
export interface MallObjectPosition extends Model {
  x: string,
  y: string,
  z: string,
}