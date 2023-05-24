import { Request, Response } from 'express';
import { Container } from 'typedi';

import { RoleService } from '../services';

class RoleController {
  constructor(private roleService: RoleService) {}
}
const roleService = Container.get(RoleService);
export const roleController = new RoleController(roleService);
