import { Service } from 'typedi';

import {
  ColonyRepository,
  RoleAssignmentRepository,
  RoleRepository,
  MemberRepository,
} from '../../repositories';
import { Place } from '../../types/models';
import * as console from 'console';
import {includes} from 'lodash';

/** Service for dealing with colony */
@Service()
export class ColonyService {
  constructor(
    private colonyRepository: ColonyRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
    private memberRepository: MemberRepository,
  ) {}
  
  public async find(colonyId: number): Promise<Place> {
    return await this.colonyRepository.find(colonyId);
  }

  public async getHoods(colonyId: number): Promise<any> {
    return await this.colonyRepository.getHoods(colonyId);
  }
  
  public async getAccessInfoByUsername(colonyId: number): Promise<object> {
    const deputyCode = await this.roleRepository.roleMap.ColonyDeputy;
    const ownerCode = await this.roleRepository.roleMap.ColonyLeader;
    return await this.roleAssignmentRepository.getAccessInfoByUsername(
      colonyId,
      ownerCode,
      deputyCode,
    );
  }

  public async postAccessInfo(
    colonyId: number,
    givenDeputies: any,
    givenOwner: string): Promise<void> {
    /**
     * old is coming from database
     * new is coming from access rights page
     */
    const deputyCode = await this.roleRepository.roleMap.ColonyDeputy;
    const ownerCode = await this.roleRepository.roleMap.ColonyLeader;
    let oldOwner = null;
    let newOwner = 0;
    const oldDeputies = [0,0,0,0,0,0,0,0];
    const newDeputies = [0,0,0,0,0,0,0,0];
    const data = await this
      .roleAssignmentRepository
      .getAccessInfoByID(colonyId, ownerCode, deputyCode);
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
        await this.roleAssignmentRepository.removeIdFromAssignment(colonyId, oldOwner, ownerCode);
        const response: any = await this.memberRepository.getPrimaryRoleName(oldOwner);
        if (response.length !== 0) {
          const primaryRoleId = response[0].primary_role_id;
          if (ownerCode === primaryRoleId){
            await this.memberRepository.update(oldOwner, {primary_role_id: null});
          }
        }
      }
      await this.roleAssignmentRepository.addIdToAssignment(colonyId, newOwner, ownerCode);
    } else {
      if (oldOwner !== 0) {
        await this.roleAssignmentRepository.removeIdFromAssignment(colonyId, oldOwner, ownerCode);
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
            this.roleAssignmentRepository.removeIdFromAssignment(colonyId, oldDeputies, deputyCode);
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
            this.roleAssignmentRepository.removeIdFromAssignment(colonyId, oldDeputies, deputyCode);
            this.memberRepository.getPrimaryRoleName(oldDeputies)
              .then((response: any) => {
                if (response.length !== 0) {
                  const primaryRoleId = response[0].primary_role_id;
                  if (deputyCode === primaryRoleId) {
                    this.memberRepository.update(oldDeputies, {primary_role_id: null});
                  }
                }
              });
            this
              .roleAssignmentRepository
              .addIdToAssignment(colonyId, newDeputies[index], deputyCode);
          } catch (e) {
            console.log(e);
          }
        }
      }
    });
  }

  public async canAdmin(colonyId: number, memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);

    if (
      roleAssignments.find(assignment => {
        return (
          [
            this.roleRepository.roleMap.Admin,
            this.roleRepository.roleMap.CityMayor,
            this.roleRepository.roleMap.DeputyMayor,
          ].includes(assignment.role_id) ||
          ([
            this.roleRepository.roleMap.ColonyLeader,
            this.roleRepository.roleMap.ColonyDeputy,
          ].includes(assignment.role_id) &&
            assignment.place_id === colonyId)
        );
      })
    ) {
      return true;
    }
    else return false;
  }

  public async canManageAccess(colonyId: number, memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);

    if (
      roleAssignments.find(assignment => {
        return (
          [
            this.roleRepository.roleMap.Admin,
            this.roleRepository.roleMap.CityMayor,
            this.roleRepository.roleMap.DeputyMayor,
          ].includes(assignment.role_id) ||
          ([this.roleRepository.roleMap.ColonyLeader].includes(assignment.role_id) &&
            assignment.place_id === colonyId)
        );
      })
    ) {
      return true;
    }
    return false;
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
}
