import { Model } from './model';

/** Collection of transaction reasons */
export enum TransactionReason {
  /** Used for issuing payments to users for their daily login bonus */
  DailyBonus = 'daily-bonus',
  /** Used for taking payments from users when they buy a house */
  HomePurchase = 'home-purchase',
  /** Used for transacting between the buyer and the seller of an item */
  ItemPurchase = 'item-purchase',
  /** Catch-all for any transaction between two members */
  MemberToMember = 'member-to-member',
  /** Catch-all for any transaction between a member and Cybertown itself */
  SystemToMember = 'system-to-member',
}

/** Defines a Transaction object as stored in the db */
export interface Transaction extends Model {
  /** Number of CCs moved */
  amount: number;
  /** The reason the transaction was created */
  reason: TransactionReason;
  /** ID of the wallet that received CCs. Can be null if the recipient is the system. */
  recipient_wallet_id?: number;
  /** ID of the wallet that sent CCS. Can be null if the sender is the system. */
  sender_wallet_id?: number;
}
