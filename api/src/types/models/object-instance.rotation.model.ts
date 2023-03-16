import { Model } from './model';

/** Defines an ObjectInstance Rotation object as stored in the db */
export interface ObjectInstanceRotation extends Model {
  x: string,
  y: string,
  z: string,
  angle: string,
}
