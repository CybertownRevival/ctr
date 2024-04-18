import { Service } from 'typedi';

import {
  PlaceRepository,
  MapLocationRepository,
  HomeDesignRepository,
  HomeRepository,
  RoleAssignmentRepository,
  RoleRepository,
} from '../../repositories';
import { Place, HomeDesign } from '../../types/models';

/** Service for dealing with members */
@Service()
export class HomeService {

  constructor(
    private placeRepository: PlaceRepository,
    private mapLocationRespository: MapLocationRepository,
    private homeDesignRespository: HomeDesignRepository,
    private homeRepository: HomeRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
  ) {}


  /**
   * Get a place object for a member's home
   * @param memberId id of the member
   */
  public async getHome(memberId: number): Promise<Place> {
    const place = await this.placeRepository.findHomeByMemberId(memberId);
    return place;
  }

  public async getHomeBlock(homePlaceId: number): Promise<Place> {
    const mapLocation = await this.mapLocationRespository.findPlaceIdMapLocation(homePlaceId);
    const place = await this.placeRepository.findById(mapLocation.parent_place_id);
    return place;

  }

  public async getPlaceHomeDesign(memberId: number, homePlaceId: number): Promise<HomeDesign> {
    const homeInfo = await this.homeRepository.findById(homePlaceId);
    
    const donorId = {
      supporter: await this.roleRepository.roleMap.Supporter,
      advocate: await this.roleRepository.roleMap.Advocate,
      devotee: await this.roleRepository.roleMap.Devotee,
      champion: await this.roleRepository.roleMap.Champion,
    };
    
    try {
      const donorLevel: any = await this.roleAssignmentRepository.getDonor(memberId, donorId);
      if (homeInfo.home_design_id === 'championhome' && donorLevel.name === 'Champion'){
        homeInfo.home_design_id = 'free';
      }
    } catch (e) {
      const donorLevel= 'none';
    }
    
    return this.homeDesignRespository.find(homeInfo.home_design_id);

  }

  public async getHomeDesign(memberId: number, homeDesignId: string): Promise<HomeDesign> {
    const donorId = {
      supporter: await this.roleRepository.roleMap.Supporter,
      advocate: await this.roleRepository.roleMap.Advocate,
      devotee: await this.roleRepository.roleMap.Devotee,
      champion: await this.roleRepository.roleMap.Champion,
    };
    
    try {
      const donorLevel: any = await this.roleAssignmentRepository.getDonor(memberId, donorId);
      if (homeDesignId === 'championhome' && donorLevel.name === 'Champion'){
        homeDesignId = 'free';
      }
    } catch (e) {
      const donorLevel= 'none';
    }
    
    return this.homeDesignRespository.find(homeDesignId);
  }

  public async createHome(
    memberId: number,
    firstName: string,
    lastName: string,
    blockId: number,
    location: number,
    houseName: string,
    houseDescription: string,
    icon2d: number|null,
    homeDesignId: string|null,
  ): Promise<void> {


    // check the space isn't already taken
    const mapLocation = await this.mapLocationRespository.findByParentPlaceIdAndLocation(
      blockId,
      location,
    );
    if(!mapLocation || !mapLocation.available) {
      throw new Error('Location is not available.');
    } else if (mapLocation.place_id > 0) {
      throw new Error('Location already taken.');
    }


    // create place
    const placeId = await this.placeRepository.create({
      type: 'home',
      member_id: memberId,
      name: houseName,
      description: houseDescription,
      map_icon_index: icon2d,
    });

    await this.homeRepository.create({
      place_id: placeId,
      home_design_id: homeDesignId,
    });

    await this.mapLocationRespository.create({
      ...mapLocation,
      place_id: placeId,
    });

  }

  public async moveHome(
    memberId: number,
    blockId: number,
    location: number,
  ): Promise<void> {


    // check the space isn't already taken
    const mapLocation = await this.mapLocationRespository.findByParentPlaceIdAndLocation(
      blockId,
      location,
    );
    if(!mapLocation || !mapLocation.available) {
      throw new Error('Location is not available.');
    } else if (mapLocation.place_id > 0) {
      throw new Error('Location already taken.');
    }

    const place = await this.placeRepository.findHomeByMemberId(memberId);

    const currentMapLocation = await this.mapLocationRespository.findPlaceIdMapLocation(place.id);
    await this.mapLocationRespository.unsetPlaceId(
      currentMapLocation.parent_place_id,
      currentMapLocation.location,
    );

    await this.mapLocationRespository.create({
      ...mapLocation,
      place_id: place.id,
    });

  }

  public async updateHome(
    memberId: number,
    houseName: string,
    icon2d: number|null,
    homeDesignId: string|null,
  ): Promise<void> {


    // update place
    const place = await this.placeRepository.updateHomeByMemberId(
      memberId,
      {
        name: houseName,
        map_icon_index: icon2d,
      }, true);

    // update home record
    await this.homeRepository.update(
      place.id,
      {home_design_id: homeDesignId},
    );

  }
}
