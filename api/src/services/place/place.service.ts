import { Service } from 'typedi';

import {
  MemberRepository,
  PlaceRepository,
  ObjectInstanceRepository,
  RoleRepository,
  RoleAssignmentRepository,
} from '../../repositories';
import { Place, ObjectInstance } from '../../types/models';

/** Service for dealing with blocks */
@Service()
export class PlaceService {
  constructor(
    private memberRepository: MemberRepository,
    private placeRepository: PlaceRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
    private roleRepository: RoleRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
  ) {}

  public async canAdmin(slug: string, placeId: number, memberId: number):
   Promise<boolean> {
    const placeRoleId = await this.findRoleIdsBySlug(slug);
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);

    //check if admin even if there is no assigned roles for the place
    if (!placeRoleId) {
      if (
        roleAssignments.find(assignment => {
          return (
            [
              this.roleRepository.roleMap.Admin,
              this.roleRepository.roleMap.CityMayor,
              this.roleRepository.roleMap.DeputyMayor,
            ].includes(assignment.role_id)
          );
        })
      ) {
        return true;
      }
    }

    //check if worker or admin with an assigned roles for the place
    if (placeRoleId) {
      if (
        roleAssignments.find(assignment => {
          return (
            [
              this.roleRepository.roleMap.Admin,
              this.roleRepository.roleMap.CityMayor,
              this.roleRepository.roleMap.DeputyMayor,
            ].includes(assignment.role_id) ||
          ([
            placeRoleId.owner,
            placeRoleId.deputy,
          ].includes(assignment.role_id) &&
           assignment.place_id === placeId)
          );
        })
      ) {
        return true;
      }
    }
    return false;
  }

  public async canManageAccess(slug: string, placeId: number, memberId: number): Promise<boolean> {
    const placeRoleId = await this.findRoleIdsBySlug(slug);
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);

    //if no roles assignable, access rights is closed to all
    if(!placeRoleId) return false;

    if (
      roleAssignments.find(assignment => {
        return (
          [
            this.roleRepository.roleMap.Admin,
            this.roleRepository.roleMap.CityMayor,
            this.roleRepository.roleMap.DeputyMayor,
          ].includes(assignment.role_id) ||
        ([placeRoleId.owner].includes(assignment.role_id) &&
         assignment.place_id === placeId)
        );
      })
    ) {
      return true;
    }
    return false;
  }

  public async findById(placeId: number): Promise<Place> {
    return await this.placeRepository.findById(placeId);
  }

  public async findBySlug(slug: string): Promise<Place> {
    return await this.placeRepository.findBySlug(slug);
  }

  public async getPlaceObjects(placeId: number): Promise<ObjectInstance[]> {
    return await this.objectInstanceRepository.findByPlaceId(placeId);
  }
  
  public async getAccessInfoByUsername(slug: string, placeId: number): Promise<object> {
    const placeRoleId = await this.findRoleIdsBySlug(slug);
    return await this
      .roleAssignmentRepository
      .getAccessInfoByUsername(placeId, placeRoleId.owner, placeRoleId.deputy);
  }
  
  public async getSecurityInfo(): Promise<object> {
    const SecurityInfo = {};
    const securityRoles  = [
      {mapName: 'SecurityChief', roleName: 'Security Chief'},
      {mapName: 'SecurityCaptain', roleName: 'Security Captain'},
      {mapName: 'SecurityLieutenant', roleName: 'Security Lieutenant'},
      {mapName: 'SecuritySergeant', roleName: 'Security Sergeant'},
      {mapName: 'SecurityOfficer', roleName: 'Security Officer'},
      {mapName: 'JailGuard', roleName: 'Jail Guard'},
    ];
    try {
      await Promise.all(securityRoles.map (async (role) => {
        const roleCode = await this.roleRepository.roleMap[role.mapName];
        await this.roleAssignmentRepository.getUsernamesByRoleId(roleCode).then(response => {
          const users = [];
          response.forEach(row => {
            users.push(row.username);
          });
          SecurityInfo[role.roleName] = users;
        });
      }));
    } catch (error) {
      console.error(error);
    }
    console.log('Security Info ', SecurityInfo);
    return SecurityInfo;
  }

  public async addStorage(name: string, memberId: number): Promise<any> {
    await this.placeRepository.create({name: name, type: 'storage', member_id: memberId});
  }
  
  public async deleteStorage(id: number): Promise<any> {
    await this.placeRepository.deleteStorageArea(id);
  }

  public async postAccessInfo(
    slug: string,
    placeId: number,
    givenDeputies: any,
    givenOwner: string): Promise<void> {
    const placeRoleId = await this.findRoleIdsBySlug(slug);
    /**
     * old is coming from database
     * new is coming from access rights page
     */
    const deputyCode = placeRoleId.deputy;
    const ownerCode = placeRoleId.owner;
    let oldOwner = null;
    let newOwner = 0;
    const oldDeputies = [0,0,0,0,0,0,0,0];
    const newDeputies = [0,0,0,0,0,0,0,0];
    const data = await this
      .roleAssignmentRepository
      .getAccessInfoByID(placeId, ownerCode, deputyCode);
    if (data.owner.length > 0) {
      oldOwner = data.owner[0].member_id;
    } else {
      oldOwner = 0;
    }
    if (givenOwner !== null && givenOwner !== '') {
      const result = await this.memberRepository.findIdByUsername(givenOwner);
      if (Array.isArray(result) && result.length > 0 && result[0].id) {
        newOwner = result[0].id;
      }
    }
    if (newOwner !== 0) {
      if (oldOwner !== 0) {
        await this.roleAssignmentRepository.removeIdFromAssignment(placeId, oldOwner, ownerCode);
        const response: any = await this.memberRepository.getPrimaryRoleName(oldOwner);
        if (response.length !== 0) {
          const primaryRoleId = response[0].primary_role_id;
          if (ownerCode === primaryRoleId){
            await this.memberRepository.update(oldOwner, {primary_role_id: null});
          }
        }
      }
      await this.roleAssignmentRepository.addIdToAssignment(placeId, newOwner, ownerCode);
    } else {
      if (oldOwner !== 0) {
        await this.roleAssignmentRepository.removeIdFromAssignment(placeId, oldOwner, ownerCode);
        const response: any = await this.memberRepository.getPrimaryRoleName(oldOwner);
        if (response.length !== 0) {
          const primaryRoleId = response[0].primary_role_id;
          if (ownerCode === primaryRoleId){
            await this.memberRepository.update(oldOwner, {primary_role_id: null});
          }
        }
      }
    }
    data.deputies.forEach((deputies, index) => {
      oldDeputies[index] = deputies.member_id;
    });
    for (let i = 0; i < givenDeputies.length; i++) {
      newDeputies[i] = await this.updateDeputyId(givenDeputies[i]);
    }
    oldDeputies.forEach((oldDeputies, index) => {
      if (oldDeputies !== newDeputies[index]) {
        if (newDeputies[index] === 0) {
          try {
            this.roleAssignmentRepository.removeIdFromAssignment(placeId, oldDeputies, deputyCode);
          } catch (e) {
            console.log(e);
          }
          if (oldDeputies !== 0) {
            this.memberRepository.getPrimaryRoleName(oldDeputies)
              .then((response: any) => {
                if (response.length !== 0) {
                  const primaryRoleId = response[0].primary_role_id;
                  if (primaryRoleId && deputyCode === primaryRoleId) {
                    this.memberRepository.update(oldDeputies, {primary_role_id: null});
                  }
                }
              });
          }
        } else {
          try {
            this.roleAssignmentRepository.removeIdFromAssignment(placeId, oldDeputies, deputyCode);
            this.memberRepository.getPrimaryRoleName(oldDeputies)
              .then((response: any) => {
                if (response.length !== 0) {
                  const primaryRoleId = response[0].primary_role_id;
                  if (deputyCode === primaryRoleId) {
                    this.memberRepository.update(oldDeputies, {primary_role_id: null});
                  }
                }
              });
            this.roleAssignmentRepository
              .addIdToAssignment(placeId, newDeputies[index], deputyCode);
          } catch (e) {
            console.log(e);
          }
        }
      }
    });
  }

  public async updatePlaces(id: number, column: string, content: string): Promise<any> {
    await this.placeRepository.updatePlaces(id, column, content);
  }

  private async findRoleIdsBySlug(slug: string): Promise<{owner: number, deputy: number}> {
    const roleId = {
      bank: {
        owner: this.roleRepository.roleMap.BankManager,
        deputy: this.roleRepository.roleMap.BankCashier,
      },
      clubs: {
        owner: this.roleRepository.roleMap.ClubsChief,
        deputy: this.roleRepository.roleMap.ClubsDeputy,
      },
      employment: {
        owner: this.roleRepository.roleMap.EmploymentChief,
        deputy: this.roleRepository.roleMap.EmploymentDeputy,
      },
      eplex: {
        owner: this.roleRepository.roleMap.ePlexChief,
        deputy: this.roleRepository.roleMap.ePlexDeputy,
      },
      flea: {
        owner: this.roleRepository.roleMap.FleaMarketChief,
        deputy: this.roleRepository.roleMap.FleaMarketDeputy,
      },
      mall: {
        owner: this.roleRepository.roleMap.MallManager,
        deputy: this.roleRepository.roleMap.MallDeputy,
      },
      outlands: {
        owner: this.roleRepository.roleMap.OutlandsChief,
        deputy: this.roleRepository.roleMap.OutlandsDeputy,
      },
      postoffice: {
        owner: this.roleRepository.roleMap.PostOfficeManager,
        deputy: this.roleRepository.roleMap.PostOfficeDeputy,
      },
      beach: {
        owner: this.roleRepository.roleMap.SunsetBeachManager,
        deputy: this.roleRepository.roleMap.SunsetBeachDeputy,
      },
      waterpark: {
        owner: this.roleRepository.roleMap.WaterParkChief,
        deputy: this.roleRepository.roleMap.WaterParkDeputy,
      },
      themepark: {
        owner: this.roleRepository.roleMap.ThemeParkChief,
        deputy: this.roleRepository.roleMap.ThemeParkDeputy,
      },
      theatre: {
        owner: this.roleRepository.roleMap.TheatreChief,
        deputy: this.roleRepository.roleMap.TheatreDeputy,
      },
      pool: {
        owner: this.roleRepository.roleMap.PoolChief,
        deputy: this.roleRepository.roleMap.PoolDeputy,
      },
      blackmarket: {
        owner: this.roleRepository.roleMap.BlackMarketChief,
        deputy: this.roleRepository.roleMap.BlackMarketDeputy,
      },
      jail: {
        owner: this.roleRepository.roleMap.SecurityChief,
      },
    };
    return roleId[slug];
  }

  private async updateDeputyId(deputy: any): Promise<number> {
    let newDeputies = 0;
    if (deputy.username !== null && deputy.username !== '') {
      const result = await this.memberRepository.findIdByUsername(deputy.username);
      if (Array.isArray(result) && result.length > 0 && result[0].id) {
        newDeputies = result[0].id;
      }
    }
    return newDeputies;
  }

  public async searchAllPlaces(
    search: string, 
    compare: string, 
    type: string, 
    limit: number, 
    offset: number): Promise<any> {
    const ownerRequired = ['home', 'club'];
    let returnPlaces = [];
    const places = await this.placeRepository.searchAllPlaces(
      search, compare, type, limit, offset);
    if(ownerRequired.includes(type)){
      for(const place of places) {
        const user = await this.memberRepository.findById(place.member_id);
        place.username = user.username;
        returnPlaces.push(place);
      }
    } else {
      returnPlaces = places;
    }
    const total = await this.placeRepository.getSearchTotal(search, compare, type);
    return {
      places: returnPlaces,
      total: total,
    };
  }
}
