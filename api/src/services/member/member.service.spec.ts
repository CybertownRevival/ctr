import { createSpyObj } from 'jest-createspyobj';
import { Container } from 'typedi';

import { MemberService } from './member.service';
import { Member } from 'models';
import {
  AvatarRepository,
  MemberRepository,
} from '../../repositories';

describe('MemberService', () => {
  const fakeMember: Partial<Member> = {
    id: 11,
    username: 'foo',
    password: 'foopassword',
    email: 'foo@foo.com',
  };
  let avatarRepository: jest.Mocked<AvatarRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let service: MemberService;

  beforeEach(() => {
    avatarRepository = createSpyObj(AvatarRepository);
    memberRepository = createSpyObj(MemberRepository);
    memberRepository.create.mockResolvedValue(fakeMember.id);
    memberRepository.find.mockResolvedValue(fakeMember as Member);
    Container.reset();
    Container.set(AvatarRepository, avatarRepository);
    Container.set(MemberRepository, memberRepository);
    service = Container.get(MemberService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('createMember', () => {
    beforeEach(async () => {
      await service.createMember(fakeMember.email, fakeMember.username, fakeMember.password);
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
        memberRepository.find.mockResolvedValue(member as Member);
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
        memberRepository.find.mockResolvedValue(member as Member);
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
        memberRepository.find.mockResolvedValue(member as Member);
      });
      it('should return true', async () => {
        expect(await service.hasReceviedLoginBonusToday(fakeMember.id)).toBe(true);
      });
    });
  });
});
