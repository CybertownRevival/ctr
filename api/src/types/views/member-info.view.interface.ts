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
}
