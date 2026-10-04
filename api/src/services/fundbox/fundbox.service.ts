import { Service } from 'typedi';

import {
  FundboxRepository,
  TransactionRepository,
} from '../../repositories';
import { Fundbox } from '../../types/models';

/** Service for dealing with Fundboxes. */
@Service()
export class FundboxService {

  constructor(
    private fundboxRepository: FundboxRepository,
    private transactionRepository: TransactionRepository,
  ) { }

  /**
   * Finds a Fundbox by its ID.
   */
  public async findById(id: number): Promise<Fundbox> {
    return this.fundboxRepository.findById(id);
  }

  /**
   * Finds the Fundbox belonging to a place.
   */
  public async findByPlaceId(placeId: number): Promise<Fundbox> {
    return this.fundboxRepository.findByPlaceId(placeId);
  }

  /**
   * Returns all Fundboxes with their place details and current balances.
   */
  public async findAllWithBalances(): Promise<any[]> {
    return this.fundboxRepository.findAllWithBalances();
  }

  /**
   * Returns a Fundbox with its place details and current balance.
   */
  public async findByIdWithBalance(id: number): Promise<any> {
    return this.fundboxRepository.findByIdWithBalance(id);
  }

  /**
   * Returns the transaction history for a Fundbox.
   */
  public async getTransactions(
    id: number,
    limit: number = 25,
    offset: number = 0,
  ): Promise<any> {
    const fundbox = await this.fundboxRepository.findById(id);

    if (!fundbox) {
      throw new Error('Fundbox not found');
    }

    return this.transactionRepository.getTransactionsByWalletId(
      fundbox.wallet_id,
      limit,
      offset,
    );
  }
}
