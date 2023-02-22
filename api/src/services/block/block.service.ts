import { Service } from 'typedi';

import {
  BlockRepository,
} from '../../repositories';

/** Service for dealing with blocks */
@Service()
export class BlockService {

  constructor(
    private blockRepository: BlockRepository,
  ) {}

  public async getMapLocationAndPlaces(blockId: number): Promise<any> {
    const locations = await this.blockRepository.getMapLocationAndPlacesByBlockId(blockId);
    return locations;
  }
}
