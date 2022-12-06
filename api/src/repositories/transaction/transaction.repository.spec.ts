import { Container } from 'typedi';

import { Db } from '../../db/db.class';
import { TransactionRepository} from './transaction.repository';

describe('TransactionRepository', () => {
  let db;
  let service: TransactionRepository;

  beforeEach(() => {
    db = {
      transaction: {
        insert: jest.fn(),
      },
    };
    Container.reset();
    Container.set(Db, db);
    service = Container.get(TransactionRepository);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
