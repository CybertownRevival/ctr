import { Service } from 'typedi';

import {
  ClubMemberRepository,
  PlaceRepository,
  MemberRepository,
  RoleAssignmentRepository,
  RoleRepository,
} from '../../repositories';

import { PlaceService } from '../place/place.service';

@Service()
export class ClubService {
  constructor(
    private clubMemberRepository: ClubMemberRepository,
    private placeRepository: PlaceRepository,
    private memberRepository: MemberRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private placeService: PlaceService,
    private roleRepository: RoleRepository,
  ) {}

  public async createClub(
    memberId: number,
    name: string,
    description: string,
    type: string,
  ): Promise<number> {
    //if club name is less than 3 characters throw error
    if (name.length < 3) {
      throw new Error('Club name must be at least 3 characters');
    }
    
    //get the user's xp if less than 500 throw error
    const userInfo = await this.memberRepository.find({id: memberId});
    console.log(userInfo.xp);
    if (userInfo.xp < 500) {
      throw new Error('You need at least 500 xp to create a club');
    }
    
    //check if club name already exists
    const clubExists = await this.placeRepository.findByName(name);
    if (clubExists) {
      throw new Error('Club name already exists');
    }
    
    //get the number of clubs the user has
    const clubCount = await this.placeRepository.countClubs(memberId);
    //if user has equal to or more than 3 clubs throw error
    if (clubCount >= 3) {
      throw new Error('You can only have upto 3 clubs');
    }
    
    /*
    * if club is private, private is true,
    * else if public, private is false,
    * else throw invalid type error
    */
    let isPrivate: boolean;
    if (type === 'private_club') {
      isPrivate = true;
    } else if (type === 'public_club') {
      isPrivate = false;
    } else {
      throw new Error('Invalid club type');
    }
    
    //information to make the place
    const params = {
      member_id: memberId,
      name: name,
      description: description,
      private: isPrivate,
      type: 'club',
      slug: 'personalclub',
    };
    
    //create the club and capture place id
    const placeId = await this.placeRepository.create(params);
    
    //find the role id for club owner
    const roleId = this.roleRepository.roleMap.ClubOwner;
    
    //hire the user as the owner of the club
    await this.roleAssignmentRepository.addIdToAssignment(placeId, memberId, roleId);
    
    //add the user to the club members list as owner
    await this.clubMemberRepository.addMember(placeId, memberId, 'owner');
    
    //return the place id for redirection
    return placeId;
  }

  public async deleteClub(place_id: number): Promise<void> {
    //delete all members of the club
    await this.clubMemberRepository.removeAllMembers(place_id);
    
    //delete all role assignments of the club
    await this.placeService.postAccessInfo(
      'personalclub', 
      place_id, 
      [
        {username: null},
        {username: null},
        {username: null},
        {username: null},
        {username: null},
        {username: null},
        {username: null},
        {username: null},
      ],
      '',
    );
    
    //delete the club
    await this.placeRepository.updatePlaces(place_id, 'status', '0');
    
    return;
  }
  
  public async getMembers(place_id: number): Promise<any> {
    return this.clubMemberRepository.getMembers(place_id);
  }
  
  public async getMemberCount(place_id: number): Promise<number> {
    return this.clubMemberRepository.getMemberCount(place_id);
  }

  public async updateClub(
    place_id: number,
    name: string,
    description: string,
    type: string,
  ): Promise<void> {
  
  }

  public async searchClubs(
    search: string,
    limit: number,
    offset: number,
    orderBy: string,
    order: string,
  ): Promise<any> {
    const clubs = await this.placeRepository.searchClubs(
      search,
      limit,
      offset,
      orderBy,
      order,
    );
    const clubsCount = await this.placeRepository.searchClubsTotal(search);
    return {clubs, clubsCount};
  }
}
