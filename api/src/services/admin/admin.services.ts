import { Service } from 'typedi';

import {
  BanRepository,
  BlockRepository,
  MemberRepository,
  MessageRepository,
  MessageboardRepository,
  RoleAssignmentRepository,
  RoleRepository,
  AvatarRepository,
  PlaceRepository,
  ObjectRepository,
  ObjectInstanceRepository,
  TransactionRepository,
  WalletRepository,
} from '../../repositories';

@Service()
export class AdminService {
  constructor(
   private banRepository: BanRepository,
   private blockRepository: BlockRepository,
   private memberRepository: MemberRepository,
   private messageRepository: MessageRepository,
   private messageboardRepository: MessageboardRepository,
   private roleAssignmentRepository: RoleAssignmentRepository,
   private roleRepository: RoleRepository,
   private avatarRespository: AvatarRepository,
   private placeRepository: PlaceRepository,
   private objectRepository: ObjectRepository,
   private objectInstanceRepository: ObjectInstanceRepository,
   private transactionRepository: TransactionRepository,
   private walletRepository: WalletRepository,
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

  public async getTransactions(type: string, limit: number, offset: number): Promise<any> {
    const transactions = await this.transactionRepository
      .getTransactions(type, limit, offset);
    const total = await this.transactionRepository.getTotal(type);
    return {
      transactions: transactions,
      total: total,
    };
  }

  public async getTransactionsByWalletId(
    id: number, limit: number, offset: number): Promise<any> {
    const transactions = await this.transactionRepository
      .getTransactionsByWalletId(id, limit, offset);
    const total = await this.transactionRepository.getWalletTotal(id);
    return {
      transactions: transactions,
      total: total,
    };
  }

  public async getCommunityData(): Promise<any> {
    const second = 1000;
    const minute = 60 * second;
    const hour = 60 * minute;
    const day = 24 * hour;
    const past30Min = new Date(Date.now() - .5 * hour);
    const pastHour = new Date(Date.now() - hour);
    const pastDay = new Date(Date.now() - day);
    const pastWeek = new Date(Date.now() - 7 * day);
    const thisWeek = new Date(Date.now() + 7 * day);
    const pastMonth = new Date(Date.now() - 30 * day);
    const pastYear = new Date(Date.now() - 365 * day);

    // User Activity
    const usersDaily = await this.memberRepository.countByDuration(pastDay);
    const usersWeekly = await this.memberRepository.countByDuration(pastWeek);
    const usersMonthly = await this.memberRepository.countByDuration(pastMonth);
    const newWeekly = await this.memberRepository.countNewUsers(pastWeek);
    const newMonthly = await this.memberRepository.countNewUsers(pastMonth);
    const newYearly = await this.memberRepository.countNewUsers(pastYear);

    // Security Data
    const recentBan = await this.banRepository.getRecentBan(pastWeek);
    const recentJail = await this.banRepository.getRecentJail(pastWeek);
    const banEnding = await this.banRepository.getUnbannedSoon(thisWeek);
    const totalBanned = await this.banRepository.getBannedTotal();
    const totalJailed = await this.banRepository.getJailedTotal() ;

    // Place Data
    const colonies = await this.placeRepository.totalByType(['colony']);
    const hoods =  await this.placeRepository.totalByType(['hood']);
    const blocks = await this.placeRepository.totalByType(['block']);
    const freeSpots = await this.blockRepository.totalFreeSpots();
    const homes = await this.placeRepository.totalByType(['home']);
    const clubs = await this.placeRepository.totalByType(['club']);
    const storages = await this.placeRepository.totalByType(['storage']);
    const privatePlaces = await this.placeRepository.totalByType(['private']);

    // Member Data
    const members = await this.memberRepository.getMemberTotal();
    const newestMembers = await this.memberRepository.getNewestMembers();

    // Money Data
    const walletData = await this.walletRepository.getWalletData();
    const averageBalance = await this.walletRepository.getAverageBalance();
    const totalBalance = await this.walletRepository.getTotalBalance();
    const topBalance = walletData[0].balance;
    const latestTransactions = await this.transactionRepository.getLatestTransactions(pastHour);
    const addUsernameToTransactions = [];
    for(const user of latestTransactions){
      let recipient_username = [{username: 'System'}];
      let sender_username = [{username: 'System'}];
      if(user.recipient_wallet_id){
        recipient_username = await this.memberRepository.findByWalletId(user.recipient_wallet_id);
      }
      if(user.sender_wallet_id){
        sender_username = await this.memberRepository.findByWalletId(user.sender_wallet_id);
      }
      user.recipient_username = recipient_username;
      user.sender_username = sender_username;
      addUsernameToTransactions.push(user);
    }

    // Role Data
    const latestHiring = await this.roleAssignmentRepository.getLatest();

    // Object Data
    //// Object Instances
    const totalUserObjects = await this.objectInstanceRepository.totalCount();
    const totalForSale = await this.objectInstanceRepository.findForSale();
    const averagePrice = await this.objectInstanceRepository.averageForSale();
    const highestPrice = await this.objectInstanceRepository.highestForSale();
    //// Mall Objects
    const mallAveragePrice = await this.objectRepository.getAverageMallPrice();
    const mallHighestPrice = await this.objectRepository.getHighestMallPrice();
    const totalMallObjects = await this.objectRepository.getAcceptedTotal();
    const totalPending = await this.objectRepository.getTotalByStatus(2);
    const totalApproved = await this.objectRepository.getTotalByStatus(3);
    const totalRejected = await this.objectRepository.getTotalByStatus(0);
    const totalStocked = await this.objectRepository.getTotalByStatus(1);
    const totalDestocked = await this.objectRepository.getTotalByStatus(4);
    const totalUploaded = await this.objectRepository.getUploadTotal();

    // Message Data
    const latestChat = await this.messageRepository.getActiveChats(past30Min);
    const latestMB = await this.messageboardRepository.getActiveMB(past30Min);

    return {
      activity: {
        totalDaily: usersDaily, 
        totalWeekly: usersWeekly, 
        totalMonthly: usersMonthly,
        newWeekly: newWeekly,
        newMonthly: newMonthly,
        newYearly: newYearly,
      },
      security: {
        recentBan: recentBan, 
        recentJail: recentJail, 
        banEnding: banEnding, 
        totalBanned: totalBanned, 
        totalJailed: totalJailed,
      },
      place: {
        totalColonies: colonies,
        totalHoods: hoods,
        totalBlocks: blocks,
        totalFreeSpots: freeSpots,
        totalHomes: homes,
        totalStorages: storages,
        totalClubs: clubs,
        totalPrivate: privatePlaces,
      },
      member: {
        totalMembers: members,
        newestMembers: newestMembers,
      },
      money: {
        wealthiestUsers: walletData,
        averageBalance: averageBalance,
        totalBalance: totalBalance,
        topBalance: topBalance,
        latestTransactions: addUsernameToTransactions,
      },
      object: {
        instances: {
          totalUserObjects: totalUserObjects,
          totalForSale: totalForSale,
          averageUserPrice: averagePrice,
          highestUserPrice: highestPrice,
        },
        mall: {
          averagePrice: mallAveragePrice,
          highestPrice: mallHighestPrice,
          totalMallObjects: totalMallObjects,
          totalPending: totalPending,
          totalApproved: totalApproved,
          totalRejected: totalRejected,
          totalStocked: totalStocked,
          totalDestocked: totalDestocked,
          totalUploaded: totalUploaded,
        },
      },
      messages: {
        chat: latestChat,
        messageboard: latestMB,
      },
      hiring: {
        latestRoleHire: latestHiring,
      },
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
