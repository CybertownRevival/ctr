import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Fundbox } from '../../types/models';

/** Repository for fetching and interacting with Fundbox data. */
@Service()
export class FundboxRepository {

  constructor(private db: Db) { }

  /**
   * Finds a Fundbox by its ID.
   */
  public async findById(id: number): Promise<Fundbox> {
    const [fundbox] = await this.db.fundbox.where({ id });
    return fundbox;
  }

  /**
   * Finds the Fundbox belonging to a place.
   */
  public async findByPlaceId(placeId: number): Promise<Fundbox> {
    const [fundbox] = await this.db.fundbox.where({ place_id: placeId });
    return fundbox;
  }

  /**
   * Finds a Fundbox by place with its public place details.
   *
   * Financial information is intentionally excluded so this may be used
   * for Fundbox discovery by any logged-in member.
   */
  public async findByPlaceIdWithDetails(placeId: number): Promise<any> {
    return this.db.knex('fundbox')
      .select(
        'fundbox.id',
        'fundbox.place_id',
        'place.name as place_name',
        'place.type as place_type',
        'place.slug as place_slug',
      )
      .join('place', 'place.id', 'fundbox.place_id')
      .where('fundbox.place_id', placeId)
      .first();
  }

  /**
   * Returns all Fundboxes with their place details and current balance.
   */
  public async findAllWithBalances(): Promise<any[]> {
    return this.db.knex('fundbox')
      .select(
        'fundbox.id',
        'fundbox.place_id',
        'fundbox.wallet_id',
        'place.name as place_name',
        'place.type as place_type',
        'place.slug as place_slug',
        'wallet.balance',
      )
      .join('place', 'place.id', 'fundbox.place_id')
      .join('wallet', 'wallet.id', 'fundbox.wallet_id')
      .orderBy('place.name', 'asc');
  }

  /**
   * Returns a Fundbox with its place details and current balance.
   */
  public async findByIdWithBalance(id: number): Promise<any> {
    return this.db.knex('fundbox')
      .select(
        'fundbox.id',
        'fundbox.place_id',
        'fundbox.wallet_id',
        'place.name as place_name',
        'place.type as place_type',
        'place.slug as place_slug',
        'wallet.balance',
      )
      .join('place', 'place.id', 'fundbox.place_id')
      .join('wallet', 'wallet.id', 'fundbox.wallet_id')
      .where('fundbox.id', id)
      .first();
  }
}
