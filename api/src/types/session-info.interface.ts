/** Object resulting from decrypting a valid JWT token */
export interface SessionInfo {
  [key: string]: any,
  /** The user's database ID */
  id: number,
}
