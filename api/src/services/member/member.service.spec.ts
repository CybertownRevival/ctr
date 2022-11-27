import { createSpyObj } from 'jest-createspyobj';
import { Container } from 'typedi';

import { Db } from '../../db/db.class';
import { MemberService } from './member.service';
import { Member, Wallet } from 'models';
import { WalletService } from '../wallet/wallet.service';

// jest.mock('../../db/db');
describe('MemberService', () => {
  const fakeMember: Partial<Member> = { id: 11 };
  const fakeWallet: Partial<Wallet> = { id: 42 };
  let db;
  let walletService: jest.Mocked<WalletService>;
  let service: MemberService;

  beforeEach(() => {
    db = {
      knex: {
        transaction: jest.fn().mockResolvedValue(fakeMember.id),
      },
      member: {
        insert: jest.fn().mockResolvedValue([fakeMember.id]),
        where: jest.fn().mockResolvedValue([fakeMember]),
      },
      wallet: {
        insert: jest.fn().mockResolvedValue([fakeWallet.id]),
      },
    };
    walletService = createSpyObj(WalletService);
    Container.reset();
    Container.set(Db, db);
    Container.set(WalletService, walletService);
    service = Container.get(MemberService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('createMember', () => {
    let walletInsert;
    let memberInsert;
    beforeEach(async () => {
      walletInsert = jest.fn().mockResolvedValue([fakeWallet.id]);
      memberInsert = jest.fn().mockResolvedValue([fakeMember.id]);
      await service.createMember('foo@foo.com', 'foo', 'foopassword');
      db.knex.transaction.mock.lastCall[0](tableName => {
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
    it('should not store the provided member password in clear text', () => {
      expect(memberInsert).toHaveBeenCalledWith(
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
  describe('hasReceivedLoginBonusToday', () => {
    describe('when a member has already received a daily login bonus', () => {
      beforeEach(() => {
        const member = {
          last_daily_login_bonus: new Date(),
          ...fakeMember,
        };
        db.member.where.mockResolvedValue([member]);
      });
      it('should return true', async () => {
        expect(await service.hasReceviedLoginBonusToday(fakeMember.id)).toBe(true);
      });
    });
    describe('when a member has not received a daily login bonus today', () => {
      beforeEach(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() -1);
        const member = {
          last_daily_login_bonus: yesterday,
          ...fakeMember,
        };
        db.member.where.mockResolvedValue([member]);
      });
      it('should return false', async () => {
        expect(await service.hasReceviedLoginBonusToday(fakeMember.id)).toBe(false);
      });
    });
    describe('when a member recieved their login bonus at exactly midnight today', () => {
      beforeEach(() => {
        const todayAtMidnight = new Date().setHours(0,0,0,0);
        const member = {
          last_daily_login_bonus: new Date(todayAtMidnight),
          ...fakeMember,
        };
        db.member.where.mockResolvedValue([member]);
      });
      it('should return true', async () => {
        expect(await service.hasReceviedLoginBonusToday(fakeMember.id)).toBe(true);
      });
    });
  });
});
