import { Service } from 'typedi';

import { PlaceRepository, ObjectInstanceRepository } from '../../repositories';
import { Place, ObjectInstance } from '../../types/models';

/** Service for dealing with blocks */
@Service()
export class PlaceService {
  constructor(
    private placeRepository: PlaceRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
  ) {}

  public async findById(placeId: number): Promise<Place> {
    return await this.placeRepository.findById(placeId);
  }

  public async findBySlug(slug: string): Promise<Place> {
    return await this.placeRepository.findBySlug(slug);
  }

  public async getPlaceObjects(placeId: number): Promise<ObjectInstance[]> {
    return await this.objectInstanceRepository.findByPlaceId(placeId);
  }

  public async addStorage(name: string, memberId: number): Promise<any> {
    await this.placeRepository.create({name: name, type: 'storage', member_id: memberId});
  }

  public async updatePlaces(id: number, column: string, content: string): Promise<any> {
    await this.placeRepository.updatePlaces(id, column, content);
  }
}
