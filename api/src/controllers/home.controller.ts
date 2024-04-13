import { Request, Response } from 'express';
import { Container } from 'typedi';
import validator from 'validator';
import * as badwords from 'badwords-list';

import {
  MemberService,
  HomeService,
} from '../services';

class HomeController {

  /**
   * Constructor.
   *
   * @param memberService service for interacting with member models
   */
  constructor(
    private memberService: MemberService,
    private homeService: HomeService,
  ) {}

  public async getHome(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    let userId = null;


    try {

      const { username } = request.params;

      if(username) {
        const user = await this.memberService.find({
          username: username,
        });
        if(user) {
          userId = user.id;
        } else {
          throw new Error('Member not found');

        }
      } else {
        userId = session.id;

      }

      const homeData = await this.homeService.getHome(userId);

      if(homeData) {
        const blockData = await this.homeService.getHomeBlock(homeData.id);
        const homeDesignData = await this.homeService.getPlaceHomeDesign(homeData.id);
        response.status(200).json({
          homeData: homeData,
          blockData: blockData,
          homeDesignData: homeDesignData,
        });
      } else {
        response.status(200).json({
          homeData: null,
          blockData: null,
          homeDesignData: null,
        });
      }


    } catch (error) {
      console.error(error);
      response.status(400).json({
        error: 'A problem occurred during fetching home data.',
      });

    }

  }

  public async createHome(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    const {
      blockId,
      location,
      houseName,
      houseDescription,
      firstName,
      lastName,
      icon2d,
      home3d,
    } = request.body;


    try {
      if (!validator.isInt(blockId)) {
        throw new Error('blockId must be passed');
      }

      if (!validator.isInt(location)) {
        throw new Error('location must be passed');
      }

      if (validator.isEmpty(houseName)) {
        throw new Error('Home name is required');
      }

      if (icon2d === null) {
        throw new Error('2D house is required');
      }

      const bannedwords = badwords.regex;
      if(houseName.match(bannedwords) || 
      houseDescription.match(bannedwords) ||
      firstName.match(bannedwords) ||
      lastName.match(bannedwords)){
        throw new Error('This language can not be used on CTR!');
      } 

      // check they don't already have a home
      const homeInfo = await this.homeService.getHome(session.id);
      if(homeInfo) {
        console.log(homeInfo);
        throw new Error('Home already exists.');
      } else {

        // check if they have enough for the home
        const memberInfo = await this.memberService.getMemberInfo(session.id);
        let purchaseAmount = 0;
        if(home3d) {
          // check they have enough in their wallet to buy the 3d home
          // this is optional (if not null)
          const homeDesignInfo = await this.homeService.getHomeDesign(session.id, home3d);
          if(homeDesignInfo.price > memberInfo.walletBalance) {
            throw new Error('Not enough funds to purchase house.');
          }
          purchaseAmount = homeDesignInfo.price;
        }

        await this.homeService.createHome(
          session.id,
          firstName,
          lastName,
          blockId,
          location,
          houseName,
          houseDescription,
          icon2d,
          home3d,
        );

        if(purchaseAmount > 0) {
          await this.memberService.performHomePurchaseTransaction(session.id, purchaseAmount);
        }

        await this.memberService.updateName(session.id, firstName, lastName);

        response.status(200).json({ 'status': 'success' });

      }

    } catch (error) {
      console.error(error);
      response.status(400).json({ 'error': error.message });
    }
  }

  public async moveHome(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    const {
      blockId,
      location,
    } = request.body;


    try {
      if (!validator.isInt(blockId)) {
        throw new Error('blockId must be passed');
      }

      if (!validator.isInt(location)) {
        throw new Error('location must be passed');
      }

      const homeInfo = await this.homeService.getHome(session.id);
      if(!homeInfo) {
        throw new Error('You don\'t have a home yet.');
      } else {

        await this.homeService.moveHome(
          session.id,
          blockId,
          location,
        );

        response.status(200).json({ 'status': 'success' });

      }

    } catch (error) {
      console.error(error);
      response.status(400).json({ 'error': error.message });
    }
  }

  public async updateHome(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    const {
      homeName,
      icon2d,
      home3d,
    } = request.body;


    try {

      if (validator.isEmpty(homeName)) {
        throw new Error('Home name is required');
      }

      if (icon2d === null) {
        throw new Error('2D house is required');
      }

      const bannedwords = badwords.regex;
      if(homeName.match(bannedwords)){
        throw new Error('This language can not be used on CTR!');
      } 

      // check they already have a home
      const homeInfo = await this.homeService.getHome(session.id);
      if(!homeInfo) {
        throw new Error('You don\'t have a home yet.');
      } else {

        const currentHomeDesign = await this.homeService.getPlaceHomeDesign(homeInfo.id);
        let refund = 0;
        let currentHomeDesignId = null;
        if(currentHomeDesign.id === 'championhome' && donor === 'Champion') {
          currentHomeDesignId = currentHomeDesign.id;
        } else if (currentHomeDesign) {
          refund = currentHomeDesign.price;
          currentHomeDesignId = currentHomeDesign.id;
        }

        // check if they have enough for the home
        const memberInfo = await this.memberService.getMemberInfo(session.id);
        let purchaseAmount = 0;
        if(home3d
          && home3d !== currentHomeDesignId
        ) {
          // check they have enough in their wallet to buy the 3d home
          // this is optional (if not null)
          const homeDesignInfo = await this.homeService.getHomeDesign(session.id, home3d);
          if(typeof homeDesignInfo.id === 'undefined') {
            throw new Error('Home design not found.');
          }

          if(homeDesignInfo.price > (memberInfo.walletBalance + refund)) {
            throw new Error('Not enough funds to purchase house.');
          }
          purchaseAmount = homeDesignInfo.price;

        }

        await this.homeService.updateHome(
          session.id,
          homeName,
          icon2d,
          home3d,
        );

        if(home3d !== currentHomeDesignId) {
          if(refund > 0) {
            await this.memberService
              .performHomeRefundTransaction(session.id, currentHomeDesign.price);
          }

          if(purchaseAmount > 0) {
            await this.memberService.performHomePurchaseTransaction(session.id, purchaseAmount);
          }
        }

        response.status(200).json({ 'status': 'success' });

      }

    } catch (error) {
      console.error(error);
      response.status(400).json({ 'error': error.message });
    }
  }

}
const memberService = Container.get(MemberService);
const homeService = Container.get(HomeService);
export const homeController = new HomeController(memberService, homeService);
