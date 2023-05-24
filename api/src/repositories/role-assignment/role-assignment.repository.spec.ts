import { Container } from 'typedi';

import { Db } from '../../db/db.class';
import { RoleAssignmentRepository } from './role-assignment.repository';

describe('RoleAssignmentRepository', () => {
  let db;
  let service: RoleAssignmentRepository;

  beforeEach(() => {
    db = {
      Role: {
        insert: jest.fn(),
      },
    };
    Container.reset();
    Container.set(Db, db);
    service = Container.get(RoleAssignmentRepository);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
