import { createSpyObj } from 'jest-createspyobj';
import { Container } from 'typedi';

import { MemberService } from './member.service';
import {
  Avatar,
  Member,
} from 'models';
import {
  AvatarRepository,
  MemberRepository,
} from '../../repositories';
import { WalletService } from '../wallet/wallet.service';

describe('MemberService', () => {
  const fakeAvatar: Partial<Avatar> = {
    id: 42,
  };
  const fakeMember: Partial<Member> = {
    id: 11,
    username: 'foo',
    last_daily_login_credit: new Date(),
    password: 'foopassword',
    email: 'foo@foo.com',
  };
  let avatarRepository: jest.Mocked<AvatarRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let walletService: jest.Mocked<WalletService>;
  let service: MemberService;

  beforeEach(() => {
    avatarRepository = createSpyObj(AvatarRepository);
    avatarRepository.find.mockResolvedValue(fakeAvatar as Avatar);
    memberRepository = createSpyObj(MemberRepository);
    memberRepository.create.mockResolvedValue(fakeMember.id);
    memberRepository.find.mockResolvedValue(fakeMember as Member);
    memberRepository.findById.mockResolvedValue(fakeMember as Member);
    walletService = createSpyObj(WalletService);
    Container.reset();
    Container.set(AvatarRepository, avatarRepository);
    Container.set(MemberRepository, memberRepository);
    Container.set(WalletService, walletService);
    service = Container.get(MemberService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('createMemberAndLogin', () => {
    beforeEach(async () => {
      await service.createMemberAndLogin(
        fakeMember.email,
        fakeMember.username,
        fakeMember.password,
      );
    });
    it('should tell the database to create a member with the provided name and email', () => {
      expect(memberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: fakeMember.email,
          username: fakeMember.username,
        }),
      );
    });
    it('should not store the provided member password in clear text', () => {
      expect(memberRepository.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: fakeMember.password,
        }),
      );
    });
    it('should return a session token for the new member', async () => {
      const token = await service.createMemberAndLogin(
        fakeMember.email,
        fakeMember.username,
        fakeMember.password,
      );
      const fakeToken = await service.getMemberToken(fakeMember.id);
      expect(token).toBe(fakeToken);
    });
  });
  describe('hasReceivedLoginBonusToday', () => {
    let member;
    describe('when a member has already received a daily login bonus', () => {
      beforeEach(() => {
        member = {
          ...fakeMember,
          last_daily_login_credit: new Date(),
        };
      });
      it('should return true', () => {
        expect(service.hasReceivedLoginBonusToday(member)).toBe(true);
      });
    });
    describe('when a member has not received a daily login bonus today', () => {
      beforeEach(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() -1);
        member = {
          ...fakeMember,
          last_daily_login_credit: yesterday,
        };
      });
      it('should return false', () => {
        expect(service.hasReceivedLoginBonusToday(member)).toBe(false);
      });
    });
    describe('when a member recieved their login bonus at exactly midnight today', () => {
      beforeEach(() => {
        const todayAtMidnight = new Date().setHours(0,0,0,0);
        member = {
          ...fakeMember,
          last_daily_login_credit: new Date(todayAtMidnight),
        };
      });
      it('should return true', () => {
        expect(service.hasReceivedLoginBonusToday(member)).toBe(true);
      });
    });
  });
});
