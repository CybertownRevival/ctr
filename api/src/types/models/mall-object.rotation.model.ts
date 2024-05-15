import { Model } from './model';

/** Defines an MallObject Rotation object as stored in the db */
export interface MallObjectRotation extends Model {
  x: string,
  y: string,
  z: string,
  angle: string,
}