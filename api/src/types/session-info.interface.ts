import { Avatar } from './models';

/** Object resulting from decrypting a valid JWT token */
export interface SessionInfo {
  [key: string]: any,
  avatar: Avatar;
  /** The user's database ID */
  id: number,
}
