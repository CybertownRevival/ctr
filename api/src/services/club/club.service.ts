import { Service } from 'typedi';

import {
  ClubMemberRepository,
  PlaceRepository,
  MemberRepository,
  RoleAssignmentRepository,
  RoleRepository,
} from '../../repositories';

@Service()
export class ClubService {
  constructor(
    private clubMemberRepository: ClubMemberRepository,
    private placeRepository: PlaceRepository,
    private memberRepository: MemberRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
  ) {}

  public async createClub(
    memberId: number,
    name: string, 
    description: string, 
    type: string,
  ): Promise<number> {
    //get the user's xp if less than 500 throw error
    const userInfo = await this.memberRepository.find({id: memberId});
    if (userInfo[0].xp < 500) {
      throw new Error('You need at least 500 xp to create a club');
      return;
    }
    //get the number of clubs the user has
    const clubCount = await this.placeRepository.countClubs(memberId);
    //if user has equal to or more than 3 clubs throw error
    if (clubCount >= 3) {
      throw new Error('You can only have upto 3 clubs');
    }
    //if club is private, type is private_club
    if (type === 'private') {
      type = 'private_club';
    }
    //else if club is public, type is public_club
    else if (type === 'public') {
      type = 'public_club';
    }
    //else throw error
    else {
      throw new Error('Invalid club type');
    }
    //information to make the place
    const params = {
      member_id: memberId,
      name: name,
      description: description,
      type: type,
    };
    //create the club and capture place id
    const placeId = await this.placeRepository.create(params);
    //find the role id for club owner
    const roleId = this.roleRepository.roleMap.ClubOwner;
    //hire the user as the owner of the club
    await this.roleAssignmentRepository.addIdToAssignment(placeId, memberId, roleId);
    //add the user to the club members list as owner
    await this.clubMemberRepository.addMember(placeId, memberId, 'owner');
    return placeId;
  }

  public async deleteClub(place_id: number): Promise<void> {
    //delete the club
    await this.placeRepository.updatePlaces(place_id, 'status', '0');
  }

  public async updateClub(
    place_id: number, 
    name: string, 
    description: string, 
    type: string,
  ): Promise<void> {
    
  }

  public async searchClubs(search: string, limit: number, offset: number): Promise<any> {
    const clubs = await this.placeRepository.findByType(
      ['public_club', 'private_club'], 
      limit, 
      offset,
    );
    const total = await this.placeRepository.totalByType(['public_club', 'private_club']);
    return {
      clubs: clubs,
      total: total,
    };
  }
}
