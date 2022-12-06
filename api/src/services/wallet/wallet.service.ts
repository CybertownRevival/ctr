import { Service } from 'typedi';

import { Wallet } from '../../types/models';
import { WalletRepository } from '../../repositories';

/** Service for interacting with wallets */
@Service()
export class WalletService {
  constructor(
    private walletRepository: WalletRepository,
  ) {}

  /**
   * Delegates to `WalletRepository#findById` to find a wallet record with the given id.
   * @param id id of wallet to look for
   * @returns promise resolving in the found wallet object, or rejecting on error
   */
  public async findById(walletId: number): Promise<Wallet> {
    return this.walletRepository.findById(walletId);
  }
}
