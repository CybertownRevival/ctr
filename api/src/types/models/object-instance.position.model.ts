import { Model } from './model';

/** Defines an ObjectInstance Position object as stored in the db */
export interface ObjectInstancePosition extends Model {
  x: string,
  y: string,
  z: string,
}
