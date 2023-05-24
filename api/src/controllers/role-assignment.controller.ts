import { Request, Response } from 'express';
import { Container } from 'typedi';

import { RoleAssignmentService } from '../services';

class RoleAssignmentController {
  constructor(private roleService: RoleAssignmentService) {}
}
const roleAssignmentService = Container.get(RoleAssignmentService);
export const roleController = new RoleAssignmentController(roleAssignmentService);
