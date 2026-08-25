import { Container } from 'typedi';
import { RoleAssignmentService } from '../services';

module.exports = async () => {
  console.log('CRON[role-credit]: Running...');
  const roleAssignmentService = Container.get(RoleAssignmentService);
  const batch = await roleAssignmentService.getMembersDueRoleCredit(20);
  console.log(`CRON[role-credit]: ${  batch.length  } to process...`);
  for(const memberId of batch) {
    await roleAssignmentService.giveWeeklyRoleCredit(memberId);
  }
};
