import { Service } from 'typedi';

import { Role } from '../../types/models';
import { RoleRepository } from '../../repositories';

/** Service for interacting with roles */
@Service()
export class RoleService {
  constructor(private roleRepository: RoleRepository) {}
}
