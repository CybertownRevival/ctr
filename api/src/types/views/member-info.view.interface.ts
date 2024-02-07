/**
 * Contains a subset of data about a member record, filtering out properties that could be sensitive
 * or not relevant to viewing by actual members themselves.
 */
export interface MemberInfoView {
  /** Member's email address */
  email?: string;
  /** Date the member's account was created */
  immigrationDate: Date;
  /** The member's username */
  username: string;
  /** The amount of CCs contained in the member's wallet */
  walletBalance?: number;
  /** Amount of experience points the member has accrued over the lifetime of their account */
  xp: number;
  /** members first name **/
  firstName?: string;
  /** members last name **/
  lastName?: string;
  /**primary role id that the member wants displayed in chat**/
  primary_role_id?: number;
  /**add chatdefault */
  chatdefault?: number;
}

export interface MemberAdminView {
  /** Member's email address */
  email?: string;
  /** Date the member's account was created */
  immigrationDate: Date;
  /** The member's username */
  username: string;
  /** The amount of CCs contained in the member's wallet */
  walletBalance?: number;
  /** Amount of experience points the member has accrued over the lifetime of their account */
  xp: number;
  /** members first name **/
  firstName?: string;
  /** members last name **/
  lastName?: string;
  /**primary role id that the member wants displayed in chat**/
  primary_role_id?: number;
  /**last login to the system**/
  last_daily_login_credit: Date;
  /**last date the user was paid out by the system**/
  last_weekly_role_credit: Date;
  /**add chatdefault */
  chatdefault?: number;
}
