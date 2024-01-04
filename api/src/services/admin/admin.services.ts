import { Service } from 'typedi';

import {
  AdminRepository,
} from '../../repositories';

@Service()
export class AdminService {
  constructor(
   private adminRepository: AdminRepository,
  ) {}
  
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
