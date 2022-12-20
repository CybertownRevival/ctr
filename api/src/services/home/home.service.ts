import * as _ from 'lodash';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';

import {
  PlaceRepository,
  MapLocationRepository,
  HomeDesignRepository,
  HomeRepository,
} from '../../repositories';
import { Member, Place, HomeDesign } from '../../types/models';
import { MemberInfoView } from '../../types/views';
import { SessionInfo } from 'session-info.interface';

/** Service for dealing with members */
@Service()
export class HomeService {
  /** Amount of cityccash a member receives each day they log in */
  public static readonly DAILY_CC_AMOUNT = 50;
  /** Amount of experience points a member received each day they log in */
  public static readonly DAILY_XP_AMOUNT = 5;
  /** Duration in minutes until a password reset attempt expires */
  public static readonly PASSWORD_RESET_EXPIRATION_DURATION = 15;
  /** Number of times to salt member passwords */
  private static readonly SALT_ROUNDS = 10;

  constructor(
    private placeRepository: PlaceRepository,
    private mapLocationRespository: MapLocationRepository,
    private homeDesignRespository: HomeDesignRepository,
    private homeRepository: HomeRepository,
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

  public getHomeDesign(homeDesignId: string): HomeDesign {
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
}
