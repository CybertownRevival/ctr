import { Container } from 'typedi';

import { mockDb } from '@spec/mocks';
import { Db } from '../../db/db.class';
import { Member, Wallet } from 'models';
import { MemberRepository} from './member.repository';

describe('MemberRepository', () => {
  const fakeMember: Partial<Member> = {
    id: 11,
    username: 'foo',
    password: 'foopassword',
    email: 'foo@foo.com',
  };
  const fakeWallet: Partial<Wallet> = { id: 42 };
  let repository: MemberRepository;

  beforeEach(() => {
    mockDb.knex.transaction.mockResolvedValue(fakeMember.id);
    Container.reset();
    Container.set(Db, mockDb);
    repository = Container.get(MemberRepository);
  });

  it('should create', () => {
    expect(repository).toBeTruthy();
  });

  describe('create', () => {
    let walletInsert;
    let memberInsert;
    beforeEach(async () => {
      walletInsert = jest.fn().mockResolvedValue([fakeWallet.id]);
      memberInsert = jest.fn().mockResolvedValue([fakeMember.id]);
      await repository.create(fakeMember);
      mockDb.knex.transaction.mock.lastCall[0](tableName => {
        const insert =(() => {
          switch(tableName) {
          case 'wallet':
            return walletInsert;
          case 'member':
            return memberInsert;
          }
        })();
        return { insert };
      });
    });
    it('should create a wallet for a new member', () => {
      expect(walletInsert).toHaveBeenCalled();
    });
    it('should assign a wallet id to the new member', () => {
      expect(memberInsert).toHaveBeenCalledWith(
        expect.objectContaining({ wallet_id: fakeWallet.id }),
      );
    });
    it('should tell the database to create a member with the provided name and email', () => {
      expect(memberInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'foo@foo.com',
          username: 'foo',
        }),
      );
    });
    it('should return the id of the new member', async () => {
      const id = await repository.create(fakeMember);
      expect(id).toBe(fakeMember.id);
    });
  });
});
