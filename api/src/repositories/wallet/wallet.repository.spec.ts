import { Container } from 'typedi';

import { Db } from '../../db/db.class';
import { WalletRepository} from './wallet.repository';

describe('WalletRepository', () => {
  let db;
  let service: WalletRepository;

  beforeEach(() => {
    db = {
      Wallet: {
        insert: jest.fn(),
      },
    };
    Container.reset();
    Container.set(Db, db);
    service = Container.get(WalletRepository);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
