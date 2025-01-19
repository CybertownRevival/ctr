import { Service } from 'typedi';

import {
  BanRepository,
  MemberRepository,
  MessageRepository,
  RoleAssignmentRepository,
  RoleRepository,
  AvatarRepository,
  PlaceRepository,
  ObjectRepository,
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
   private placeRepository: PlaceRepository,
   private objectRepository: ObjectRepository,
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

  public async fireRole(member_id: number, role_id: number, place_id: number): Promise<void> {
    const response: any = await this.memberRepository.getPrimaryRoleName(member_id);
    if (response.length !== 0) {
      const primaryRoleId = response[0].primary_role_id;
      if (role_id === primaryRoleId){
        await this.memberRepository.update(member_id, {primary_role_id: null});
      }
    }
    await this.roleAssignmentRepository.removeIdFromAssignment(place_id, member_id, role_id);
    return;
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

  public async getRoleList(): Promise<any> {
    return this.roleRepository.findAll();
  }

  public async hireRole(member_id: number, role_id: number): Promise<void> {
    this.roleAssignmentRepository.addIdToAssignment(null, member_id, role_id);
    return;
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

  public async updatePlaces(id: number, column: string, content: string): Promise<any> {
    await this.placeRepository.updatePlaces(id, column, content);
  }

  public async updateObjects(
    id: number,
    name: string,
    directory: string,
    filename: string,
    image: string,
    price: number,
    limit: number,
    quantity: number,
    status: number,
  ): Promise<any> {
    await this.objectRepository
      .update(id, {
        name: name,
        directory: directory,
        filename: filename,
        image: image,
        price: price,
        limit: limit,
        quantity: quantity,
        status: status,
      });
  }

  public async searchPlaces(type: string[], limit: number, offset: number): Promise<any> {
    const places = await this.placeRepository.findByType(type, limit, offset, [0,1], 'id');
    const total = await this.placeRepository.totalByType(type);
    return {
      places: places,
      total: total,
    };
  }
}
