import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { RoleAssignment } from '../../types/models';

/** Repository for fetching/interacting with role assignment data in the database. */
@Service()
export class RoleAssignmentRepository {
  constructor(private db: Db) {}
}
