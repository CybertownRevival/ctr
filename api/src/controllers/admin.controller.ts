import {Request, Response} from 'express';
import { Container } from 'typedi';

import { AdminService, MemberService, AvatarService, PlaceService } from '../services';

class AdminController {
  constructor(
    private adminService: AdminService, 
    private memberService: MemberService, 
    private avatarService: AvatarService,
    private placeService: PlaceService,
  ) {}
  
  public async addBan(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.canAdmin(session.id);
    if (admin) {
      try {
        await this.adminService.addBan(
          request.body.ban_member_id,
          request.body.time_frame,
          request.body.type,
          session.id,
          request.body.reason,
        );
        response.status(200).json({message: 'Ban added successfully'});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }
  
  public async addDonor(request: Request, response: Response): Promise<void>{
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const accessLevel = await this.memberService.getAccessLevel(session.id);
    if (accessLevel === 'admin') {
      try {
        await this.adminService.addDonor(
          request.body.member_id,
          request.body.level,
        );
        response.status(200).json({message: 'Donor added successfully'});
      } catch (e) {
        console.log(e);
        response.status(400).json({error: 'Error adding donor'});
      }
    } else {
      response.status(403).json({error: 'Access Denied'});
    }
  }
  
  public async getBanHistory(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin) {
      try {
        const banHistory = await this.adminService
          .getBanHistory(Number(request.query.ban_member_id.toString()));
        response.status(200).json({banHistory});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }
  
  public async deleteBan(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.canAdmin(session.id);
    if (admin) {
      try {
        const banId = Number(request.body.banId);
        const reason = request.body.banReason;
        const deleteBy = await this.memberService.getMemberInfoPublic(session.id);
        const updateReason = `${reason} (Deleted by ${deleteBy.username})`;
        await this.adminService.deleteBan(banId, updateReason);
        response.status(200).json({message: 'Ban deleted successfully'});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async fireRole(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const { member_id, role_id } = request.body;
    let { place_id } = request.body;
    if (place_id !== null) {
      place_id = parseInt(place_id);
    }
    const accessLevel = await this.memberService.getAccessLevel(session.id);
    if (accessLevel.includes('mayor')) {
      try {
        await this.adminService.fireRole(
          parseInt(member_id),
          parseInt(role_id),
          place_id,
        );
        response.status(200).json({message: 'Role fired successfully'});
      } catch(e) {
        console.log(e);
        response.status(500).json({error: 'Internal Server Error'});
      }
    } else {
      response.status(403).json({error: 'Access Denied'});
    }
  }
  
  public async getDonor(request: Request, response: Response): Promise<string> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const accessLevel = await this.memberService.getAccessLevel(session.id);
    if (accessLevel === 'admin') {
      const currentLevel = await this
        .adminService
        .getDonor(Number(request.query.memberId));
      response.status(200).json({donorLevel: currentLevel});
    } else {
      response.status(403).json({error: 'Access Denied'});
    }
  }

  public async getRoleList(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin) {
      try {
        const roleList = await this.adminService.getRoleList();
        response.status(200).json({roles: roleList});
      } catch (e) {
        console.log(e);
        response.status(500).json({error: 'Internal Server Error'});
      }
    }
  }

  public async hireRole(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const accessLevel = await this.memberService.getAccessLevel(session.id);
    if (accessLevel.includes('mayor')) {
      const {member_id, role_id} = request.body;
      try {
        await this.adminService.hireRole(
          parseInt(member_id),
          parseInt(role_id),
        );
        response.status(200).json({message: 'Role hired successfully'});
      } catch(e) {
        console.log(e);
        response.status(500).json({error: 'Internal Server Error'});
      }
    } else {
      response.status(403).json({error: 'Access Denied'});
    }
  }
  
  public async searchUsers(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin) {
      try {
        const results = await this.adminService.searchUsers(
          request.query.search.toString(),
          Number.parseInt(request.query.limit.toString()),
          Number.parseInt(request.query.offset.toString()),
        );
        response.status(200).json({results});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }
  
  public async searchUserChat(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin) {
      try {
        const results = await this.adminService.searchUserChat(
          request.query.search.toString(),
          Number.parseInt(request.query.user.toString()),
          Number.parseInt(request.query.limit.toString()),
          Number.parseInt(request.query.offset.toString()),
        );
        response.status(200).json({results});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async avatars(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.canAdmin(session.id);
    if (admin) {
      try {
        const results = await this.adminService.searchAvatars(
          parseInt(request.query.status.toString()),
          parseInt(request.query.limit.toString()),
          parseInt(request.query.offset.toString()),
        );
        response.status(200).json({results});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async avatarApprove(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.canAdmin(session.id);
    if (!admin) {
      response.status(403).json({message: 'Access Denied'});
      return;
    }
    try {
      this.avatarService.approve(
        parseInt(request.body.id.toString()),
      );
      response.status(200).json({'status':'success'});
    } catch (error) {
      console.log(error);
      response.status(400).json({error});
    }
  }
  public async avatarReject(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.canAdmin(session.id);
    if (!admin) {
      response.status(403).json({message: 'Access Denied'});
      return;
    }
    try {
      this.avatarService.reject(
        parseInt(request.body.id.toString()),
      );
      response.status(200).json({'status':'success'});
    } catch (error) {
      console.log(error);
      response.status(400).json({error});
    }
  }

  public async places(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin) {
      try {
        const results = await this.adminService.searchPlaces(
          [request.query.type.toString()],
          parseInt(request.query.limit.toString()),
          parseInt(request.query.offset.toString()),
        );
        
        response.status(200).json({results});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async searchAllPlaces(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin) {
      try {
        const compareValues = ['=', '!=', '>', '<', '>=', '<='];
        const search = request.query.search.toString().replace(/[^0-9a-zA-Z \-[\]/()]/g, '');
        const compare = request.query.compare.toString();
        const type = request.query.type.toString();

        if(compareValues.includes(compare)){
          const results = await this.placeService.searchAllPlaces(
            search,
            compare,
            type,
            Number.parseInt(request.query.limit.toString()),
            Number.parseInt(request.query.offset.toString()),
          );
          response.status(200).json({results});
        }
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async placesUpdate(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin) {
      try {
        this.adminService.updatePlaces(
          parseInt(request.body.id.toString()),
          request.body.column.toString(),
          request.body.content.toString(),
        );
        response.status(200).json({status: 'success'});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async objectssUpdate(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.canAdmin(session.id);
    if (admin) {
      const id = parseInt(request.body.id);
      const name = request.body.name;
      const directory = request.body.directory;
      const filename = request.body.filename;
      const image = request.body.thumbnail;
      const price = request.body.price;
      let limit;
      if(request.body.limit === '' ||
        request.body.limit === null ||
        request.body.limit === 'undefined'
      ){
        limit = 0;
      } else {
        limit = request.body.limit;
      }
      const quantity = request.body.quantity;
      const status = request.body.status;
      try {
        if(id && name && directory && filename && image && 
          price >= 0 && limit >= 0 && quantity >= 0 && status >= 0){
          this.adminService.updateObjects(
            id,
            name,
            directory,
            filename,
            image,
            price,
            limit,
            quantity,
            status
          );
        } else {
          throw new Error ('Some details are blank. Please complete the form');
        }
        response.status(200).json({status: 'success'});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }
}

const adminService = Container.get(AdminService);
const memberService = Container.get(MemberService);
const avatarService = Container.get(AvatarService);
const placeService = Container.get(PlaceService);
export const adminController = new AdminController(
  adminService, memberService, avatarService, placeService);
