import { createSpyObj } from 'jest-createspyobj';
import QueryBuilder from 'knex';

import { Db } from '../../db/db.class';
import { MemberService } from './member.service';
import { Member, Wallet } from 'models';

// jest.mock('../../db/db');
describe('MemberService', () => {
  const fakeMember: Partial<Member> = { id: 11 };
  const fakeWallet: Partial<Wallet> = { id: 42 };
  let db;
  let service: MemberService;

  beforeEach(() => {
    db = {
      member: {
        insert: jest.fn().mockReturnValue(
          Promise.resolve([fakeMember.id]),
        ),
      },
    };
    service = new MemberService(db);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('createMember', () => {
    beforeEach(async () => {
      db.wallet = {
        insert: jest.fn().mockReturnValue(
          Promise.resolve([fakeWallet.id]),
        ),
      };
      service = new MemberService(db);
      await service.createMember('foo@foo.com', 'foo', 'foopassword');
    });
    it('should create a wallet for a new member', () => {
      expect(db.wallet.insert).toHaveBeenCalled();
    });
    it('should assign a wallet id to the new member', () => {
      expect(db.member.insert).toHaveBeenCalledWith(
        expect.objectContaining({ wallet_id: fakeWallet.id }),
      );
    });
    it('should tell the database to create a member with the provided name and email', () => {
      expect(db.member.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'foo@foo.com',
          username: 'foo',
        }),
      );
    });
    it('should not store the provided member password in clear text', () => {
      expect(db.member.insert).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: 'foopassword',
        }),
      );
    });
    it('should return the id of the new member', async () => {
      const id = await service.createMember('foo@foo.com', 'foo', 'foopassword');
      expect(id).toBe(fakeMember.id);
    });
  });
});
