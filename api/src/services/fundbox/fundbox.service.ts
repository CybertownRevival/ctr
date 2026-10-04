import { Service } from 'typedi';

import {
  FundboxRepository,
  RoleAssignmentRepository,
  RoleRepository,
  TransactionRepository,
} from '../../repositories';
import { Fundbox } from '../../types/models';

/** Service for dealing with Fundboxes. */
@Service()
export class FundboxService {

  constructor(
    private fundboxRepository: FundboxRepository,
    private transactionRepository: TransactionRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
  ) { }

  /**
   * Finds a Fundbox by its ID.
   */
  public async findById(id: number): Promise<Fundbox> {
    return this.fundboxRepository.findById(id);
  }

  /**
   * Finds the Fundbox belonging to a place.
   */
  public async findByPlaceId(placeId: number): Promise<Fundbox> {
    return this.fundboxRepository.findByPlaceId(placeId);
  }

  /**
   * Returns all Fundboxes with their place details and current balances.
   */
  public async findAllWithBalances(): Promise<any[]> {
    return this.fundboxRepository.findAllWithBalances();
  }

  /**
   * Returns a Fundbox with its place details and current balance.
   */
  public async findByIdWithBalance(id: number): Promise<any> {
    return this.fundboxRepository.findByIdWithBalance(id);
  }

  /**
   * Checks whether a member has authority to award CCs from a Fundbox.
   *
   * Fundbox spending authority is intentionally stricter than normal place
   * administration. Only the leader/owner of the Fundbox's place may award
   * CCs. Deputies and global administrative/audit roles do not automatically
   * receive spending authority.
   */
  public async canAward(id: number, memberId: number): Promise<boolean> {
    const fundbox = await this.fundboxRepository.findByIdWithBalance(id);

    if (!fundbox) {
      return false;
    }

    const roleAssignments =
      await this.roleAssignmentRepository.getByMemberId(memberId);

    let ownerRoleId: number;

    if (fundbox.place_type === 'colony') {
      ownerRoleId = this.roleRepository.roleMap.ColonyLeader;
    } else {
      const placeOwnerRoles = {
        bank: this.roleRepository.roleMap.BankManager,
        beach: this.roleRepository.roleMap.SunsetBeachChief,
        blackmarket: this.roleRepository.roleMap.BlackMarketChief,
        cityhall: this.roleRepository.roleMap.CityCouncil,
        clubdir: this.roleRepository.roleMap.ClubsChief,
        employment: this.roleRepository.roleMap.EmploymentChief,
        fleamarket: this.roleRepository.roleMap.FleaMarketChief,
        funpark: this.roleRepository.roleMap.FunParkChief,
        jail: this.roleRepository.roleMap.SecurityChief,
        mall: this.roleRepository.roleMap.MallManager,
        newcomers: this.roleRepository.roleMap.SeniorCityGuide,
        theatre: this.roleRepository.roleMap.TheatreChief,
        postoffice: this.roleRepository.roleMap.PostOfficeManager,
        pool: this.roleRepository.roleMap.PoolChief,
        themepark: this.roleRepository.roleMap.ThemeParkChief,
        waterpark: this.roleRepository.roleMap.WaterParkChief,
      };

      ownerRoleId = placeOwnerRoles[fundbox.place_slug];
    }

    if (!ownerRoleId) {
      return false;
    }

    return Boolean(
      roleAssignments.find(assignment =>
        assignment.role_id === ownerRoleId &&
        assignment.place_id === fundbox.place_id,
      ),
    );
  }

  /**
   * Returns the transaction history for a Fundbox.
   */
  public async getTransactions(
    id: number,
    limit: number = 25,
    offset: number = 0,
  ): Promise<any> {
    const fundbox = await this.fundboxRepository.findById(id);

    if (!fundbox) {
      throw new Error('Fundbox not found');
    }

    return this.transactionRepository.getTransactionsByWalletId(
      fundbox.wallet_id,
      limit,
      offset,
    );
  }
}
