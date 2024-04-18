import { Service } from 'typedi';

import {
  BanRepository,
  MemberRepository,
  MessageRepository,
  RoleAssignmentRepository,
  RoleRepository,
  AvatarRepository,
} from '../../repositories';

@Service()
export class AdminService {
  constructor(
   private banRepository: BanRepository,
   private memberRepository: MemberRepository,
   private messageRepository: MessageRepository,
   private roleAssignmentRepository: RoleAssignmentRepository,
   private roleRepository: RoleRepository,
   private avatarRespository: AvatarRepository,
  ) {}
  
  public async addBan(ban_member_id, time_frame, type, assigner_member_id, reason): Promise<void> {
    const end_date = new Date();
    end_date.setTime(end_date.getTime() + time_frame * 24 * 60 * 60 * 1000);
    end_date.getUTCDate();
    await this.banRepository.addBan(ban_member_id, end_date, type, assigner_member_id, reason);
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
      await this.roleAssignmentRepository.addDonor(member_id, donorId);
    } catch (e) {
      console.log(e);
    }
  }
  
  public async deleteBan(banId: number, updateReason: string): Promise<void>{
    await this.banRepository.deleteBan(banId, updateReason);
  }
  
  public async getBanHistory(ban_member_id: number): Promise<any> {
    return await this.banRepository.getBanHistory(ban_member_id);
  }
  
  public async getDonor(member_id: number): Promise<string> {
    const donorId = {
      supporter: await this.roleRepository.roleMap.Supporter,
      advocate: await this.roleRepository.roleMap.Advocate,
      devotee: await this.roleRepository.roleMap.Devotee,
      champion: await this.roleRepository.roleMap.Champion,
    };
    try {
      return await this.roleAssignmentRepository.getDonor(member_id, donorId);
    } catch (e) {
      console.log(e);
    }
  }
  
  public async searchUsers(search: string, limit: number, offset: number): Promise<any> {
    const users = await this.memberRepository.searchUsers(search, limit, offset);
    const total = await this.memberRepository.getTotal(search);
    return {
      users: users,
      total: total,
    };
  }
  
  public async searchUserChat(
    search: string,
    user: number,
    limit: number,
    offset: number,
  ): Promise<any> {
    const messages = await this.messageRepository.searchUserChat(search, user, limit, offset);
    const total = await this.messageRepository.getChatTotal(search, user);
    return {
      messages: messages,
      total: total,
    };
  }

  public async searchAvatars(status: number, limit: number, offset: number): Promise<any> {
    const avatars = await this.avatarRespository.findByStatus(status, limit, offset);
    const total = await this.avatarRespository.totalByStatus(status);
    return {
      avatars: avatars,
      total: total,
    };
  }
}
