import { Service } from 'typedi';

import { House } from '../../types/models';

/** Repository for fetching/interacting with house data. */
@Service()
export class HouseRepository {

  private houseData = [
    {
      'id': '003',
      'price': 160,
    },
    {
      'id': '004',
      'price': 160,
    },
    {
      'id': '005',
      'price': 160,
    },
    {
      'id': '000',
      'price': 200,
    },
    {
      'id': '001',
      'price': 200,
    },
    {
      'id': '002',
      'price': 200,
    },
    {
      'id': '006',
      'price': 2000,
    },
    {
      'id': '007',
      'price': 2000,
    },
    {
      'id': '00a',
      'price': 50000,
    },
    {
      'id': '009',
      'price': 75000,
    },
    {
      'id': '008',
      'price': 100000,
    },
  ]

  constructor() {}

  /**
   * Finds a house with the given id.
   * @param id id of home to look for
   * @returns promise resolving in the found house object, or rejecting on error
   */
  public findHouseById(houseId: string): House {
    return this.houseData.find(row => row.id === houseId);
  }


}
