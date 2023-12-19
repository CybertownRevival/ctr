import { Service } from 'typedi';

import { RoleAssignment } from '../../types/models';
import {
  RoleAssignmentRepository,
  MemberRepository,
  TransactionRepository,
} from '../../repositories';

/** Service for interacting with roles */
@Service()
export class RoleAssignmentService {
  constructor(
    private roleAssignmentRepository: RoleAssignmentRepository,
    private memberRepository: MemberRepository,
    private transactionRepository: TransactionRepository,
  ) {}
  
  public async getMembersRoles(memberId: number): Promise<RoleAssignment[]> {
    const response = this.roleAssignmentRepository.getByMemberId(memberId);
    return response;
  }
  
  /**
   * Grabs all payments due to users from database 50 at a time and 
   * places them in response array sorts respone into highest cc payout 
   * then drops all other payouts to the same user
   */
  public async getMembersDueRoleCredit(limit: number): Promise<any[]> {
    let offset = 0;
    let response = [];
    let continueFetch = true;
    
    while (continueFetch) {
      const newRecords = await this.roleAssignmentRepository.getMembersDueRoleCredit(limit, offset);
      
      if (newRecords.length === 0) {
        continueFetch = false;
      } else {
        response = [...response, ...newRecords];
        offset += limit;
      }
    }
    response.sort((a, b) => b.income_cc - a.income_cc);
    const uniqueHighest = response.reduce((acc, curr) => {
      if (!acc.some(item => item.member_id === curr.member_id)) {
        acc.push(curr);
      }
      return acc;
    }, []);
    return uniqueHighest;
  }
  public async giveWeeklyRoleCredit(
    memberId: number,
    memberXp: number,
    walletId: number,
    incomeXp: number,
    incomeCc: number,
    roleId: number,
  ): Promise<void> {
    await this.transactionRepository.createWeeklyRoleCreditTransaction(
      walletId,
      incomeCc,
      roleId,
    );

    await this.memberRepository.update(memberId, {
      last_weekly_role_credit: new Date(),
      xp: memberXp + incomeXp,
      
    });
  }
}
