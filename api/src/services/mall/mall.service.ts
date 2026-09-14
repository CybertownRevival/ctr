import { Service } from 'typedi';

import {
  RoleAssignmentRepository,
  RoleRepository,
  ObjectInstanceRepository,
  ObjectRepository,
  PlaceRepository,
  MallRepository,
  MemberRepository,
} from '../../repositories';
import { MallObjectPosition, MallObjectRotation } from 'models';
import { ObjectWithUsername } from '../../repositories/object/object.repository';
import { CountRow } from '../../repositories/row.types';

/** Service for dealing with the mall */
@Service()
export class MallService {
  constructor(
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
    private objectRepository: ObjectRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
    private placeRepository: PlaceRepository,
    private mallRepository: MallRepository,
    private memberRepository: MemberRepository,
  ) {}

  public async canAdmin(memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    if (
      roleAssignments.find(assignment => {
        return [
          this.roleRepository.roleMap.Admin,
          this.roleRepository.roleMap.MallDeputy,
          this.roleRepository.roleMap.MallManager,
        ].includes(assignment.role_id);
      })
    ) {
      return true;
    }
    return false;
  }

  public async isObjectAvailable(objectId: number): Promise<boolean> {
    const object = await this.objectRepository.find({ id: objectId });
    if (!object) {
      return false;
    }
    const instances = await this.objectInstanceRepository.countByObjectId(objectId);

    if (object.status !== 1) {
      return false;
    }

    if (instances >= object.quantity) {
      return false;
    }
    return true;
  }

  public async getMallStores(orderBy?: string){
    if(!orderBy){
      orderBy = 'id';
    }
    return await this.placeRepository.findAllStores(orderBy);
  }

  /**
   * Attaches the creator name, the store and the sold count to a page of
   * objects, using one query per fact for the whole page rather than one per
   * object.
   *
   * The previous per-object loop issued three queries for every row, which the
   * Out of Stock view multiplied by every stocked object in the mall. Output is
   * unchanged, including the 'Deleted User' placeholder for objects whose
   * creator no longer exists.
   */
  private async decorateObjects(
    objects: ObjectWithUsername[],
  ): Promise<ObjectWithUsername[]> {
    if (!objects.length) {
      return objects;
    }

    const objectIds = objects.map(object => object.id);
    const memberIds = objects
      .map(object => object.member_id)
      .filter(memberId => !!memberId);

    const [members, stores, counts] = await Promise.all([
      this.memberRepository.findByIds(memberIds),
      this.mallRepository.getStoresByObjectIds(objectIds),
      this.objectInstanceRepository.countByObjectIds(objectIds),
    ]);

    objects.forEach(object => {
      const member = object.member_id ? members[object.member_id] : null;
      object.username = (member && member.username) || 'Deleted User';
      object.store = stores[object.id];
      object.instances = counts[object.id] || 0;
    });

    return objects;
  }

  public async findSoldOut(){
    const objects = await this.objectRepository.findMallSoldOut();
    return {objects: await this.decorateObjects(objects)};
  }

  public async getObjectsCatalog(
    limit: number,
    offset: number,
  ): Promise<{ objects: ObjectWithUsername[]; total: CountRow[] }> {
    const returnObjects = [];
    const fleamarket = await this.placeRepository.findBySlug('fleamarket');
    const blackmarket = await this.placeRepository.findBySlug('blackmarket');
    const objects = await this.objectRepository.getObjectsCatalog(limit, offset);
    for (const obj of objects) {
      obj.forSale = await this.objectInstanceRepository.countForSaleById(obj.id);
      obj.publicPlaces = await this.objectInstanceRepository
        .countByPublicPlaces(obj.id, fleamarket.id, blackmarket.id);
      obj.instances = await this.objectInstanceRepository.countByObjectId(obj.id);
      returnObjects.push(obj);
    }
    const total = await this.objectRepository.catalogTotal();
    return {
      objects: returnObjects,
      total: total,
    };
  }

  public async searchMallObjects(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{ objects: ObjectWithUsername[]; total: CountRow[] }> {
    const objects = await this.objectRepository.searchMallObjects(search, limit, offset);
    const total = await this.objectRepository.getTotal(search);
    return {
      objects: await this.decorateObjects(objects),
      total: total,
    };
  }

  public async searchAllObjects(
    search: string, 
    compare: string, 
    status: number, 
    limit: number, 
    offset: number): Promise<{ objects: ObjectWithUsername[]; total: CountRow[] }> {
    const objects = await this.objectRepository.searchAllObjects(
      search, compare, status, limit, offset);
    const total = await this.objectRepository.getSearchTotal(search, compare, status);
    return {
      objects: await this.decorateObjects(objects),
      total: total,
    };
  }

  public async getAllObjects(
    column: string, 
    compare: string, 
    content: string, 
    limit: number, 
    offset: number, 
    orderBy: string){
    const objects = await this.objectRepository
      .findAllObjects(column, compare, content, limit, offset, orderBy);
    const total = await this.objectRepository.total(column, compare, content);
    return {
      objects: await this.decorateObjects(objects),
      total: total,
    };
  }

  public async getStore(id: number){
    const stores = await this.mallRepository.getStore(id);
    return stores;
  }

  public async updateObjectPlacement(
    mallObjectId: number,
    positionObj: MallObjectPosition,
    rotationObj: MallObjectRotation,
  ): Promise<void> {
    const position = JSON.stringify({
      x: Number.parseFloat(positionObj.x),
      y: Number.parseFloat(positionObj.y),
      z: Number.parseFloat(positionObj.z),
    });
    const rotation = JSON.stringify({
      x: Number.parseFloat(rotationObj.x),
      y: Number.parseFloat(rotationObj.y),
      z: Number.parseFloat(rotationObj.z),
      angle: Number.parseFloat(rotationObj.angle),
    });

    return await this.mallRepository.updateObjectPlacement(
      mallObjectId,
      position,
      rotation,
    );
  }
}
