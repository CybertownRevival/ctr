import { Service } from 'typedi';

import { RoleAssignment } from '../../types/models';
import { RoleAssignmentRepository } from '../../repositories';

/** Service for interacting with roles */
@Service()
export class RoleAssignmentService {
  constructor(private roleAssignmentRepository: RoleAssignmentRepository) {}
}
