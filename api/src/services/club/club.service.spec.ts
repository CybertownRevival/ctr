import { Container } from 'typedi';
import { createSpyObj } from 'jest-createspyobj';

import { ClubService } from './club.service';
import {
  PlaceRepository,
  MemberRepository,
  RoleAssignmentRepository,
  RoleRepository,
} from '../../repositories';

describe('ClubService', () => {
  let clubService: ClubService;
  let placeRepository: jest.Mocked<PlaceRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let roleAssignmentRepository: jest.Mocked<RoleAssignmentRepository>;
  let roleRepository: jest.Mocked<RoleRepository>;

  beforeEach(() => {
    placeRepository = createSpyObj(PlaceRepository);
    memberRepository = createSpyObj(MemberRepository);
    roleAssignmentRepository = createSpyObj(RoleAssignmentRepository);
    roleRepository = createSpyObj(RoleRepository);
    clubService = createSpyObj(ClubService);
  });

  it('should create a club successfully', async () => {
    memberRepository.find = jest.fn().mockResolvedValue([{ id: 1, xp: 600 }]);
    placeRepository.countClubs = jest.fn().mockResolvedValue(2);
    placeRepository.create = jest.fn().mockResolvedValue(1);
    roleRepository.roleMap = { ClubOwner: 1 };
    roleAssignmentRepository.addIdToAssignment = jest.fn().mockResolvedValue(null);

    const result = await clubService.createClub(1, 'Test Club', 'This is a test club', 'public');

    expect(result).toBe(1);
    expect(placeRepository.create).toHaveBeenCalledWith({
      member_id: 1,
      name: 'Test Club',
      description: 'This is a test club',
      type: 'public_club',
    });
    expect(roleAssignmentRepository.addIdToAssignment).toHaveBeenCalledWith(1, 1, 1);
  });

  it('should throw an error if user has less than 500 xp', async () => {
    memberRepository.find = jest.fn().mockResolvedValue([{ id: 1, xp: 400 }]);

    await expect(clubService.createClub(1, 'Test Club', 'This is a test club', 'public'))
      .rejects
      .toThrow('You need at least 500 xp to create a club');
  });

  it('should throw an error if user has 3 or more clubs', async () => {
    memberRepository.find = jest.fn().mockResolvedValue([{ id: 1, xp: 600 }]);
    placeRepository.countClubs = jest.fn().mockResolvedValue(3);

    await expect(clubService.createClub(1, 'Test Club', 'This is a test club', 'public'))
      .rejects
      .toThrow('You can only have upto 3 clubs');
  });

  it('should throw an error if club type is invalid', async () => {
    memberRepository.find = jest.fn().mockResolvedValue([{ id: 1, xp: 600 }]);
    placeRepository.countClubs = jest.fn().mockResolvedValue(2);

    await expect(clubService.createClub(1, 'Test Club', 'This is a test club', 'invalid'))
      .rejects
      .toThrow('Invalid club type');
  });
});