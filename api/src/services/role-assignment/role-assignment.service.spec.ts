import { Container } from 'typedi';
import { createSpyObj } from 'jest-createspyobj';

import { RoleAssignmentService } from './role-assignment.service';
import { RoleAssignmentRepository } from '../../repositories';

describe('RoleAssignmentService', () => {
  let roleAssignmentRepository: jest.Mocked<RoleAssignmentRepository>;
  let service: RoleAssignmentService;

  beforeEach(() => {
    roleAssignmentRepository = createSpyObj(RoleAssignmentRepository);
    Container.reset();
    Container.set(RoleAssignmentRepository, roleAssignmentRepository);
    service = Container.get(RoleAssignmentService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
