import { Service } from 'typedi';

import {
  AdminRepository,
} from '../../repositories';

@Service()
export class AdminService {
  constructor(
   private adminRepository: AdminRepository,
  ) {}
  
  public async addBan(ban_member_id, time_frame, type, assigner_member_id, reason): Promise<void> {
    const end_date = new Date();
    console.log(`check a ${end_date}`);
    end_date.setTime(end_date.getTime() + time_frame * 24 * 60 * 60 * 1000);
    console.log(`check b ${end_date}`);
    end_date.getUTCDate();
    console.log(`check c ${end_date}`);
    await this.adminRepository.addBan(ban_member_id, end_date, type, assigner_member_id, reason);
  }
  
  public async getBanHistory(ban_member_id: number): Promise<any> {
    return await this.adminRepository.getBanHistory(ban_member_id);
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
