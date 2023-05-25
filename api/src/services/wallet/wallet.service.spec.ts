import { Container } from 'typedi';
import { createSpyObj } from 'jest-createspyobj';

import { WalletService } from './wallet.service';
import { WalletRepository } from '../../repositories';

describe('WalletService', () => {
  let walletRepository: jest.Mocked<WalletRepository>;
  let service: WalletService;

  beforeEach(() => {
    walletRepository = createSpyObj(WalletRepository);
    Container.reset();
    Container.set(WalletRepository, walletRepository);
    service = Container.get(WalletService);
  });
});
