import { Container } from 'typedi';
import { RoleAssignmentService } from '../services';

module.exports = async () => {
  console.log('CRON[role-credit]: Running...');
  const roleAssignmentService = Container.get(RoleAssignmentService);
  const batch = await roleAssignmentService.getMembersDueRoleCredit(20);
  console.log(`CRON[role-credit]: ${  batch.length  } to process...`);
  batch.forEach(async (row) => {
    await roleAssignmentService.giveWeeklyRoleCredit(
      row.member_id,
      row.xp,
      row.wallet_id,
      row.income_xp,
      row.income_cc,
      row.role_id,
    );
  });
};
