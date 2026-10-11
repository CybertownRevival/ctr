import crypto from 'crypto';
import fs from 'fs';
import { Service } from 'typedi';

import {
  DesignerHomeRepository,
  MemberRepository,
  PlaceRepository,
  RoleAssignmentRepository,
  RoleRepository,
  SettingRepository,
} from '../../repositories';
import { DesignerHome, HomeDesign, Place } from '../../types/models';

/** Service for dealing with Designer Homes (member uploaded home designs) */
@Service()
export class DesignerHomeService {
  constructor(
    private designerHomeRepository: DesignerHomeRepository,
    private memberRepository: MemberRepository,
    private placeRepository: PlaceRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
    private settingRepository: SettingRepository,
  ) {}

  public static readonly STATUS_DELETED = 0;
  public static readonly STATUS_ACTIVE = 1;
  public static readonly STATUS_PENDING = 2;
  public static readonly WRL_FILESIZE_LIMIT = 1048576;
  public static readonly IMAGE_FILESIZE_LIMIT = 81920;
  public static readonly TEXTURE_FILESIZE_LIMIT = 262144;
  public static readonly MAX_TEXTURES = 5;
  public static readonly MIN_PRICE = 10;
  public static readonly STORE_TYPE = 'deshomeshop';
  /** Prefix used for Designer Homes in home.home_design_id */
  public static readonly HOME_DESIGN_PREFIX = 'deshome-';
  public static readonly UPLOAD_STATUS_SETTING = 'deshomes_upload_status';

  public async canAdmin(memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    return !!roleAssignments.find(assignment => {
      return [
        this.roleRepository.roleMap.Admin,
        this.roleRepository.roleMap.HomebuilderManager,
      ].includes(assignment.role_id);
    });
  }

  public async getStores(): Promise<Place[]> {
    return this.placeRepository.findAllByType(DesignerHomeService.STORE_TYPE);
  }

  public async isStore(placeId: number): Promise<boolean> {
    const place = await this.placeRepository.findById(placeId);
    return !!place && place.type === DesignerHomeService.STORE_TYPE;
  }

  public async isUploadEnabled(): Promise<boolean> {
    const status = await this.settingRepository.get(DesignerHomeService.UPLOAD_STATUS_SETTING);
    return status !== 'OFF';
  }

  public async setUploadEnabled(enabled: boolean): Promise<void> {
    await this.settingRepository.set(
      DesignerHomeService.UPLOAD_STATUS_SETTING,
      enabled ? 'ON' : 'OFF',
    );
  }

  public async isBanned(memberId: number): Promise<boolean> {
    return this.designerHomeRepository.isBanned(memberId);
  }

  public async getBans(): Promise<any[]> {
    return this.designerHomeRepository.findBans();
  }

  /**
   * Bans a member from uploading Designer Homes.
   * @returns false if no member has the given username
   */
  public async ban(username: string, bannedByMemberId: number): Promise<boolean> {
    const member = await this.memberRepository.find({ username });
    if (!member) {
      return false;
    }
    await this.designerHomeRepository.addBan(member.id, bannedByMemberId);
    return true;
  }

  public async unban(memberId: number): Promise<void> {
    await this.designerHomeRepository.removeBan(memberId);
  }

  public async findById(id: number): Promise<DesignerHome> {
    return this.designerHomeRepository.findById(id);
  }

  public async getPending(): Promise<any[]> {
    return this.designerHomeRepository.findWithDetails({
      status: DesignerHomeService.STATUS_PENDING,
    });
  }

  public async getStocked(): Promise<any[]> {
    return this.designerHomeRepository.findWithDetails({
      status: DesignerHomeService.STATUS_ACTIVE,
    });
  }

  public async getByCreator(memberId: number): Promise<any[]> {
    return this.designerHomeRepository.findWithDetails({ member_id: memberId });
  }

  /** Gets the Designer Homes for sale in a store, flagging the ones the member already owns. */
  public async getForSale(placeId: number, memberId: number): Promise<any[]> {
    const designerHomes = await this.designerHomeRepository.findWithDetails({
      place_id: placeId,
      status: DesignerHomeService.STATUS_ACTIVE,
    });
    const ownedIds = await this.designerHomeRepository.findOwnedIds(memberId);
    return designerHomes.map(designerHome => ({
      ...designerHome,
      owned: ownedIds.includes(designerHome.id),
    }));
  }

  public async getOwnedHomeDesigns(memberId: number): Promise<HomeDesign[]> {
    const designerHomes = await this.designerHomeRepository.findOwnedByMemberId(memberId);
    return designerHomes.map(designerHome => this.toHomeDesign(designerHome));
  }

  public async approve(id: number, placeId: number): Promise<void> {
    await this.designerHomeRepository.update(id, {
      place_id: placeId,
      status: DesignerHomeService.STATUS_ACTIVE,
    });
  }

  public async move(id: number, placeId: number): Promise<void> {
    await this.designerHomeRepository.update(id, { place_id: placeId });
  }

  /**
   * Takes a Designer Home off sale (or rejects a pending upload). Members who already bought
   * it keep it, so the files are left in place.
   */
  public async remove(id: number): Promise<void> {
    await this.designerHomeRepository.update(id, {
      status: DesignerHomeService.STATUS_DELETED,
    });
  }

  /**
   * Buys a Designer Home for a member, paying its price to the creator.
   * @returns an error message, or null on success
   */
  public async buy(memberId: number, id: number): Promise<string | null> {
    const designerHome = await this.designerHomeRepository.findById(id);
    if (!designerHome || designerHome.status !== DesignerHomeService.STATUS_ACTIVE) {
      return 'This home is no longer available.';
    }
    if (await this.designerHomeRepository.isOwned(memberId, id)) {
      return 'You already own this home.';
    }

    const buyer = await this.memberRepository.findById(memberId);
    const creator = designerHome.member_id
      ? await this.memberRepository.findById(designerHome.member_id)
      : null;

    const purchased = await this.designerHomeRepository.purchase(
      memberId,
      buyer.wallet_id,
      creator?.wallet_id ?? null,
      id,
      designerHome.price,
    );
    return purchased ? null : 'Not enough funds to buy this home.';
  }

  /**
   * Stores the uploaded files and creates a pending Designer Home.
   * @param textureFiles textures referenced by the .wrl, saved under their original names
   */
  public async create(
    wrlFile,
    imageFile,
    textureFiles: any[],
    name: string,
    price: number,
    placeId: number,
    memberId: number,
  ): Promise<number> {
    const directory = crypto.randomUUID();
    const fileName = crypto.randomBytes(8).toString('hex');
    const uploadPath = `${process.env.ASSETS_DIR}/worlds/deshomes/${directory}`;
    const imageExtension = imageFile.name.split('.').pop().toLowerCase();

    fs.mkdirSync(uploadPath, { recursive: true });
    await wrlFile.mv(`${uploadPath}/${fileName}.wrl`);
    await imageFile.mv(`${uploadPath}/${fileName}.${imageExtension}`);
    for (const textureFile of textureFiles) {
      await textureFile.mv(`${uploadPath}/${textureFile.name}`);
    }

    return this.designerHomeRepository.create({
      member_id: memberId,
      place_id: placeId,
      name,
      price,
      directory,
      filename: `${fileName}.wrl`,
      image: `${fileName}.${imageExtension}`,
      status: DesignerHomeService.STATUS_PENDING,
    });
  }

  public isHomeDesignId(homeDesignId: string | null): boolean {
    return !!homeDesignId && homeDesignId.startsWith(DesignerHomeService.HOME_DESIGN_PREFIX);
  }

  /**
   * Finds the Designer Home behind a home.home_design_id value.
   * @param memberId when given, the member must own the Designer Home
   */
  public async findHomeDesign(homeDesignId: string, memberId?: number): Promise<HomeDesign> {
    const id = Number.parseInt(homeDesignId.slice(DesignerHomeService.HOME_DESIGN_PREFIX.length));
    if (Number.isNaN(id)) {
      return undefined;
    }
    if (memberId && !(await this.designerHomeRepository.isOwned(memberId, id))) {
      return undefined;
    }
    const designerHome = await this.designerHomeRepository.findById(id);
    return designerHome ? this.toHomeDesign(designerHome) : undefined;
  }

  /**
   * Designer Homes are paid for once in the store, so they cost nothing to switch to and
   * give no refund when switching away.
   */
  private toHomeDesign(designerHome: DesignerHome): HomeDesign {
    return {
      id: `${DesignerHomeService.HOME_DESIGN_PREFIX}${designerHome.id}`,
      price: 0,
      name: designerHome.name,
      assets_dir: `deshomes/${designerHome.directory}/`,
      world_filename: designerHome.filename,
      image: `/assets/worlds/deshomes/${designerHome.directory}/${designerHome.image}`,
    };
  }
}
