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
   * Finds a Fundbox by place with its public place details.
   */
  public async findByPlaceIdWithDetails(placeId: number): Promise<any> {
    return this.fundboxRepository.findByPlaceIdWithDetails(placeId);
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
        (
          assignment.place_id === fundbox.place_id ||
          (
            assignment.place_id === null &&
          (
            (
              fundbox.place_slug === 'jail' &&
              ownerRoleId === this.roleRepository.roleMap.SecurityChief
            ) ||
            (
              fundbox.place_slug === 'cityhall' &&
              ownerRoleId === this.roleRepository.roleMap.CityCouncil
            )
          )
        )
        ),
      ),
    );
  }

  /**
   * Checks whether a member may view a Fundbox's financial information.
   *
   * Global audit roles receive access according to their area of responsibility.
   * Local leaders and deputies receive access only to their assigned place.
   */
  public async canView(id: number, memberId: number): Promise<boolean> {
    const fundbox = await this.fundboxRepository.findByIdWithBalance(id);

    if (!fundbox) {
      return false;
    }

    const roleAssignments =
      await this.roleAssignmentRepository.getByMemberId(memberId);

    // Admin and City Mayor may audit every Fundbox.
    if (
      roleAssignments.find(assignment =>
        [
          this.roleRepository.roleMap.Admin,
          this.roleRepository.roleMap.CityMayor,
        ].includes(assignment.role_id),
      )
    ) {
      return true;
    }

    // Colony Representative may audit every Colony Fundbox.
    if (
      fundbox.place_type === 'colony' &&
      roleAssignments.find(assignment =>
        assignment.role_id ===
          this.roleRepository.roleMap.ColonyRepresentative,
      )
    ) {
      return true;
    }

    // Places Chief may audit every City Place Fundbox.
    if (
      fundbox.place_type === 'public' &&
      roleAssignments.find(assignment =>
        assignment.role_id === this.roleRepository.roleMap.PlacesChief,
      )
    ) {
      return true;
    }

    // Colony leaders and deputies may view their own Colony Fundbox.
    if (fundbox.place_type === 'colony') {
      return Boolean(
        roleAssignments.find(assignment =>
          [
            this.roleRepository.roleMap.ColonyLeader,
            this.roleRepository.roleMap.ColonyDeputy,
          ].includes(assignment.role_id) &&
          assignment.place_id === fundbox.place_id,
        ),
      );
    }

    const placeRoles = {
      bank: [
        this.roleRepository.roleMap.BankManager,
        this.roleRepository.roleMap.BankCashier,
      ],
      beach: [
        this.roleRepository.roleMap.SunsetBeachChief,
        this.roleRepository.roleMap.SunsetBeachDeputy,
      ],
      blackmarket: [
        this.roleRepository.roleMap.BlackMarketChief,
        this.roleRepository.roleMap.BlackMarketDeputy,
      ],
      cityhall: [
        this.roleRepository.roleMap.CityCouncil,
      ],
      clubdir: [
        this.roleRepository.roleMap.ClubsChief,
        this.roleRepository.roleMap.ClubsDeputy,
      ],
      employment: [
        this.roleRepository.roleMap.EmploymentChief,
        this.roleRepository.roleMap.EmploymentDeputy,
      ],
      fleamarket: [
        this.roleRepository.roleMap.FleaMarketChief,
        this.roleRepository.roleMap.FleaMarketDeputy,
      ],
      funpark: [
        this.roleRepository.roleMap.FunParkChief,
        this.roleRepository.roleMap.FunParkDeputy,
      ],
      jail: [
        this.roleRepository.roleMap.SecurityChief,
      ],
      mall: [
        this.roleRepository.roleMap.MallManager,
        this.roleRepository.roleMap.MallDeputy,
      ],
      newcomers: [
        this.roleRepository.roleMap.SeniorCityGuide,
        this.roleRepository.roleMap.CityGuide,
      ],
      theatre: [
        this.roleRepository.roleMap.TheatreChief,
        this.roleRepository.roleMap.TheatreDeputy,
      ],
      postoffice: [
        this.roleRepository.roleMap.PostOfficeManager,
        this.roleRepository.roleMap.PostOfficeDeputy,
      ],
      pool: [
        this.roleRepository.roleMap.PoolChief,
        this.roleRepository.roleMap.PoolDeputy,
      ],
      themepark: [
        this.roleRepository.roleMap.ThemeParkChief,
        this.roleRepository.roleMap.ThemeParkDeputy,
      ],
      waterpark: [
        this.roleRepository.roleMap.WaterParkChief,
        this.roleRepository.roleMap.WaterParkDeputy,
      ],
    };

    const allowedRoles = placeRoles[fundbox.place_slug];

    if (!allowedRoles) {
      return false;
    }

    return Boolean(
      roleAssignments.find(assignment =>
        allowedRoles.includes(assignment.role_id) &&
        (
          assignment.place_id === fundbox.place_id ||
          (
            assignment.place_id === null &&
            (
              (
                fundbox.place_slug === 'jail' &&
                assignment.role_id === this.roleRepository.roleMap.SecurityChief
              ) ||
              (
                fundbox.place_slug === 'cityhall' &&
                assignment.role_id === this.roleRepository.roleMap.CityCouncil
              )
            )
        )
        ),
      ),
    );
  }

  /**
   * Returns the Fundboxes available to a member through global audit access.
   *
   * Admin and City Mayor may audit all Fundboxes.
   * Colony Representative may audit Colony Fundboxes.
   * Places Chief may audit public City Place Fundboxes.
   *
   * Local leader/deputy access is handled separately by canView().
   */
  public async getAuditFundboxes(memberId: number): Promise<any[]> {
    const roleAssignments =
      await this.roleAssignmentRepository.getByMemberId(memberId);

    const roleIds = roleAssignments.map(assignment => assignment.role_id);

    const canAuditAll = [
      this.roleRepository.roleMap.Admin,
      this.roleRepository.roleMap.CityMayor,
    ].some(roleId => roleIds.includes(roleId));

    const canAuditColonies = roleIds.includes(
      this.roleRepository.roleMap.ColonyRepresentative,
    );

    const canAuditPlaces = roleIds.includes(
      this.roleRepository.roleMap.PlacesChief,
    );

    if (!canAuditAll && !canAuditColonies && !canAuditPlaces) {
      return [];
    }

    const fundboxes = await this.fundboxRepository.findAllWithBalances();

    if (canAuditAll) {
      return fundboxes;
    }

    return fundboxes.filter(fundbox =>
      (canAuditColonies && fundbox.place_type === 'colony') ||
      (canAuditPlaces && fundbox.place_type === 'public'),
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
