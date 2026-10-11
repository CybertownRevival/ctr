import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {
  DesignerHome,
  Transaction,
  TransactionReason,
  Wallet,
} from '../../types/models';

/** Repository for fetching/interacting with Designer Homes data in the database. */
@Service()
export class DesignerHomeRepository {
  constructor(private db: Db) {}

  public async findById(id: number): Promise<DesignerHome> {
    return this.db.designerHome.where({ id }).first();
  }

  public async create(designerHome: Partial<DesignerHome>): Promise<number> {
    const [id] = await this.db.designerHome.insert(designerHome);
    return id;
  }

  public async update(id: number, props: Partial<DesignerHome>): Promise<void> {
    await this.db.designerHome.where({ id }).update(props);
  }

  /**
   * Finds Designer Homes with the creator's username and the store name attached.
   * @param where column filters applied to the designer_home table
   */
  public async findWithDetails(where: Partial<DesignerHome>): Promise<any[]> {
    const filters = {};
    Object.keys(where).forEach(column => {
      filters[`designer_home.${column}`] = where[column];
    });
    return this.db.designerHome
      .select(
        'designer_home.*',
        'member.username',
        'place.name as store_name',
        'place.slug as store_slug',
      )
      .leftJoin('member', 'member.id', 'designer_home.member_id')
      .leftJoin('place', 'place.id', 'designer_home.place_id')
      .where(filters)
      .orderBy('designer_home.created_at', 'asc');
  }

  /** Finds the approved Designer Homes a member has bought. */
  public async findOwnedByMemberId(memberId: number): Promise<DesignerHome[]> {
    return this.db.designerHome
      .select('designer_home.*')
      .join('designer_home_owner', 'designer_home_owner.designer_home_id', 'designer_home.id')
      .where('designer_home_owner.member_id', memberId)
      .orderBy('designer_home.name', 'asc');
  }

  public async findOwnedIds(memberId: number): Promise<number[]> {
    const rows = await this.db.designerHomeOwner
      .select('designer_home_id')
      .where({ member_id: memberId });
    return rows.map(row => row.designer_home_id);
  }

  public async isOwned(memberId: number, designerHomeId: number): Promise<boolean> {
    const owner = await this.db.designerHomeOwner
      .where({ member_id: memberId, designer_home_id: designerHomeId })
      .first();
    return !!owner;
  }

  /**
   * Charges the buyer, pays the creator (if they still exist) and records ownership,
   * all within a single db transaction.
   * @returns false if the buyer did not have enough funds
   */
  public async purchase(
    buyerMemberId: number,
    buyerWalletId: number,
    creatorWalletId: number | null,
    designerHomeId: number,
    amount: number,
  ): Promise<boolean> {
    return await this.db.knex.transaction(async trx => {
      const buyerWallet = await trx<Wallet>('wallet')
        .where({ id: buyerWalletId })
        .forUpdate()
        .first();
      if (buyerWallet.balance < amount) {
        return false;
      }

      await trx<Wallet>('wallet')
        .where({ id: buyerWalletId })
        .update({ balance: buyerWallet.balance - amount });
      await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.DesignerHomePurchase,
        sender_wallet_id: buyerWalletId,
      });

      if (creatorWalletId && amount > 0) {
        await trx<Wallet>('wallet')
          .where({ id: creatorWalletId })
          .increment('balance', amount);
        await trx<Transaction>('transaction').insert({
          amount,
          reason: TransactionReason.DesignerHomeProfit,
          recipient_wallet_id: creatorWalletId,
        });
      }

      await trx('designer_home_owner').insert({
        member_id: buyerMemberId,
        designer_home_id: designerHomeId,
      });
      return true;
    });
  }

  public async findBans(): Promise<any[]> {
    return this.db.designerHomeBan
      .select(
        'designer_home_ban.member_id',
        'designer_home_ban.created_at',
        'member.username',
        'banned_by.username as banned_by_username',
      )
      .join('member', 'member.id', 'designer_home_ban.member_id')
      .leftJoin('member as banned_by', 'banned_by.id', 'designer_home_ban.banned_by_member_id')
      .orderBy('member.username', 'asc');
  }

  public async isBanned(memberId: number): Promise<boolean> {
    const ban = await this.db.designerHomeBan.where({ member_id: memberId }).first();
    return !!ban;
  }

  public async addBan(memberId: number, bannedByMemberId: number): Promise<void> {
    await this.db.designerHomeBan
      .insert({ member_id: memberId, banned_by_member_id: bannedByMemberId })
      .onConflict('member_id')
      .ignore();
  }

  public async removeBan(memberId: number): Promise<void> {
    await this.db.designerHomeBan.where({ member_id: memberId }).del();
  }
}
