import { createSpyObj } from 'jest-createspyobj';
import { Container } from 'typedi';

import { Db } from '../../db/db.class';
import { Wallet } from 'models';
import { WalletService } from './wallet.service';

// jest.mock('../../db/db');
describe('WalletService', () => {
  const fakeWallet: Partial<Wallet> = { id: 42 };
  let db;
  let service: WalletService;

  beforeEach(() => {
    db = {
      wallet: {
        insert: jest.fn().mockResolvedValue([fakeWallet.id]),
      },
    };
    Container.reset();
    Container.set(Db, db);
    service = Container.get(WalletService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
