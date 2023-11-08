import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Role } from '../../types/models';

/** Repository for fetching/interacting with role data in the database. */
@Service()
export class RoleRepository {
  constructor(private db: Db) {
    this.populateRoleMap();
  }
  public roleMap: any = {};

  private async populateRoleMap(): Promise<void> {
    const roles = await this.findAll();

    roles.forEach(role => {
      const sanitizedName = role.name.replace(/\s/g, '');
      this.roleMap[sanitizedName] = role.id;
    });
  }

  public async findAll(): Promise<Role[]> {
    return this.db.role.where({});
  }
}
