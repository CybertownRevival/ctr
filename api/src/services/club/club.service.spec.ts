import { Container } from 'typedi';
import { createSpyObj } from 'jest-createspyobj';

import { ClubService } from './club.service';
import { ClubMemberRepository } from '../../repositories';

describe('ClubService', () => {
  let clubMemberRepository: jest.Mocked<ClubMemberRepository>;
  let service: ClubService;

  beforeEach(() => {
    clubMemberRepository = createSpyObj(ClubMemberRepository);
    Container.reset();
    Container.set(ClubMemberRepository, clubMemberRepository);
    service = Container.get(ClubService);
  });
});
