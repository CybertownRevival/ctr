import { Container } from 'typedi';
import { createSpyObj } from 'jest-createspyobj';

import { RoleService } from './role.service';
import { RoleRepository } from '../../repositories';

describe('RoleService', () => {
  let roleRepository: jest.Mocked<RoleRepository>;
  let service: RoleService;

  beforeEach(() => {
    roleRepository = createSpyObj(RoleRepository);
    Container.reset();
    Container.set(RoleRepository, roleRepository);
    service = Container.get(RoleService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
