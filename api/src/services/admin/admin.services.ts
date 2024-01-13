import { Service } from 'typedi';

import {
  AdminRepository,
  RoleRepository,
} from '../../repositories';

@Service()
export class AdminService {
  constructor(
   private adminRepository: AdminRepository,
   private roleRepository: RoleRepository,
  ) {}
  
  public async addBan(ban_member_id, time_frame, type, assigner_member_id, reason): Promise<void> {
    const end_date = new Date();
    end_date.setTime(end_date.getTime() + time_frame * 24 * 60 * 60 * 1000);
    end_date.getUTCDate();
    await this.adminRepository.addBan(ban_member_id, end_date, type, assigner_member_id, reason);
  }
  
  public async addDonor(member_id: number, donor: string): Promise<void> {
    const donorId = {
      supporter: await this.roleRepository.roleMap.Supporter,
      advocate: await this.roleRepository.roleMap.Advocate,
      devotee: await this.roleRepository.roleMap.Devotee,
      champion: await this.roleRepository.roleMap.Champion,
      donorLevel: await this.roleRepository.roleMap[donor],
    };
    try {
      await this.adminRepository.addDonor(member_id, donorId);
    } catch (e) {
      console.log(e);
    }
  }
  
  public async deleteBan(banId: number, updateReason: string): Promise<void>{
    await this.adminRepository.deleteBan(banId, updateReason);
  }
  
  public async getBanHistory(ban_member_id: number): Promise<any> {
    return await this.adminRepository.getBanHistory(ban_member_id);
  }
  
  public async getDonor(member_id: number): Promise<string> {
    const donorId = {
      supporter: await this.roleRepository.roleMap.Supporter,
      advocate: await this.roleRepository.roleMap.Advocate,
      devotee: await this.roleRepository.roleMap.Devotee,
      champion: await this.roleRepository.roleMap.Champion,
    };
    try {
      return await this.adminRepository.getDonor(member_id, donorId);
    } catch (e) {
      console.log(e);
    }
  }
  
  public async searchUsers(search: string, limit: string, offset: string): Promise<any> {
    const users = await this.adminRepository.searchUsers(search, limit, offset);
    const total = await this.adminRepository.getTotal(search);
    return {
      users: users,
      total: total,
    };
  }
  
  public async searchUserChat(
    search: string,
    user: number,
    limit: string,
    offset: string,
  ): Promise<any> {
    const messages = await this.adminRepository.searchUserChat(search, user, limit, offset);
    const total = await this.adminRepository.getChatTotal(search, user);
    return {
      messages: messages,
      total: total,
    };
  }
}
