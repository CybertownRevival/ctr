import { Service } from 'typedi';

import {
  BlockRepository,
  MapLocationRepository,
  HoodRepository,
} from '../../repositories';
import {Place} from '../../types/models';

/** Service for dealing with blocks */
@Service()
export class BlockService {

  constructor(
    private blockRepository: BlockRepository,
    private mapLocationRepository: MapLocationRepository,
    private hoodRepository: HoodRepository,
  ) {}

  public async find(blockId: number): Promise<Place> {
    return await this.blockRepository.find(blockId);
  }

  public async getHood(blockId: number): Promise<Place> {
    const blockMapLocation = await this.mapLocationRepository.findPlaceIdMapLocation(blockId);
    return await this.hoodRepository.find(blockMapLocation.parent_place_id);
  }

  public async getMapLocationAndPlaces(blockId: number): Promise<any> {
    return await this.blockRepository.getMapLocationAndPlacesByBlockId(blockId);
  }

  public async resetMapLocationAvailability(blockId: number): Promise<void> {
    return await this.mapLocationRepository.resetAvailabilityByParentPlaceId(blockId);
  }

  public async setMapLocationAvailable(blockId:number, location: number): Promise<void> {
    return await this.mapLocationRepository.createAvailableLocation(blockId, location);
  }
}
