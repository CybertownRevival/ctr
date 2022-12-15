import { Service } from 'typedi';

import { HomeDesign } from '../../types/models';

/** Repository for fetching/interacting with house data. */
@Service()
export class HomeDesignRepository {

  private homeDesigns: HomeDesign[] = [
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
   * Finds a home design with the given id.
   * @param id id of home design to look for
   * @returns promise resolving in the found home design object, or rejecting on error
   */
  public find(homeDesignId: string): HomeDesign {
    return this.homeDesigns.find(row => row.id === homeDesignId);
  }


}
