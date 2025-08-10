import {Request, Response} from 'express';
import { Container } from 'typedi';

import { 
  AdminService, 
  MemberService, 
  AvatarService, 
  PlaceService, 
  RoleAssignmentService,
  ObjectInstanceService, } from '../services';
import { Place } from 'models/place.model';
import * as badwordlist from 'badwords-list';

class AdminController {
  constructor(
    private adminService: AdminService, 
    private memberService: MemberService, 
    private avatarService: AvatarService,
    private placeService: PlaceService,
    private roleAssignmentService: RoleAssignmentService,
    private objectInstanceService: ObjectInstanceService,
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
        const returnRoles = [];
        const roleList = await this.adminService.getRoleList();
        for(const role of roleList) {
          const count = await this.roleAssignmentService.countByAssigned(role.id);
          role.total = count;
          returnRoles.push(role);
        }
        response.status(200).json({roles: returnRoles});
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

  public async getTransactions(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    const returnResults = [];
    const rebuild = [];
    if (admin) {
      try {
        let results = null;
        let findUsername = null;
        results = await this.adminService.getTransactions(
          request.query.type.toString(),
          Number.parseInt(request.query.limit.toString()),
          Number.parseInt(request.query.offset.toString()),
        );
        findUsername = results.transactions
        for(const res of findUsername) {
          let sender = [{username: 'System'}];
          let receiver = [{username: 'System'}];
          if(res.sender_wallet_id){
            sender = await this.memberService
              .getMemberByWalletId(res.sender_wallet_id);
          }
          if(res.recipient_wallet_id){
            receiver = await this.memberService
              .getMemberByWalletId(res.recipient_wallet_id);
          }
          res.sender = sender;
          res.receiver = receiver;
          res.sender_wallet_id = null;
          res.recipient_wallet_id = null;
          rebuild.push(res);
        }
        returnResults.push(rebuild);
        returnResults.push(results.total);
        response.status(200).json({returnResults});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async getTransactionsByWalletId(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    const returnResults = [];
    const rebuild = [];
    if (admin) {
      try {
        let results = null;
        let findUsername = null;
        const memberId = request.params.id;
        const user = await this.memberService.find({ id: Number.parseInt(memberId) });
        results = await this.adminService.getTransactionsByWalletId(
          user.wallet_id,
          Number.parseInt(request.query.limit.toString()),
          Number.parseInt(request.query.offset.toString()),
        );
        findUsername = results.transactions
        for(const res of findUsername) {
          let sender = [{username: 'System'}];
          let receiver = [{username: 'System'}];
          if(res.sender_wallet_id){
            sender = await this.memberService
              .getMemberByWalletId(res.sender_wallet_id);
          }
          if(res.recipient_wallet_id){
            receiver = await this.memberService
              .getMemberByWalletId(res.recipient_wallet_id);
          }
          res.sender = sender;
          res.receiver = receiver;
          res.sender_wallet_id = null;
          res.recipient_wallet_id = null;
          rebuild.push(res);
        }
        returnResults.push(rebuild);
        returnResults.push(results.total);
        response.status(200).json({results});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async getObjectInstances(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin.includes('security')) {
      try {
        let returnResults = [];
        let results = null;
        results = await this.objectInstanceService.findAllObjectInstances(
          Number.parseInt(request.query.limit.toString()),
          Number.parseInt(request.query.offset.toString()),
        );
        returnResults = results;
        response.status(200).json({returnResults});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async getOwnedObjects(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin.includes('admin')) {
      try {
        const id = request.params.id;
        const results = await this.objectInstanceService.getOwnedObjects(
          Number.parseInt(id),
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

  public async getCommunityData(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin.includes('security')) {
      try {
        const results = await this.adminService.getCommunityData();
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

  public async findUserPlaces(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (admin) {
      const types = ['club', 'storage'];
      const type = request.query.type.toString();
      const id = request.query.id.toString();
      try {
        if(types.includes(type)) {
          const results = await this.placeService.findUserPlaces(parseInt(id), type);
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

  public async placesUpdate(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.getAccessLevel(session.id);
    if (!admin) {
      response.status(403).json({message: 'Access Denied'});
      return;
    }
    
    const  placeinfo = request.body;

    // Check for blank required fields based on type
    const blankFields = [];
    
    // Name is always required
    console.log(placeinfo.name);
    if (!placeinfo.name || placeinfo.name.trim() === '') {
      blankFields.push('Name');
    }
    if (placeinfo.name.match(badwordlist.regex)) {
      response.status(400).json({error: 'Inappropriate language detected in name'});
    }

    // Description is required for specific types
    if (['public', 'shop', 'colony', 'home', 'club', 'private'].includes(placeinfo.type)) {
      if (!placeinfo.description || placeinfo.description.trim() === '') {
        blankFields.push('Description');
      }
      if (placeinfo.description.match(badwordlist.regex)) {
        response.status(400).json({error: 'Inappropriate language detected in description'});
      }
    }
    
    // Slug is required for specific types
    if (['public', 'shop', 'colony', 'private'].includes(placeinfo.type)) {
      if (!placeinfo.slug || placeinfo.slug.trim() === '') {
        blankFields.push('Slug');
      }
      if (placeinfo.slug.match(badwordlist.regex)) {
        response.status(400).json({error: 'Inappropriate language detected in slug'});
      }
    }
    
    if (blankFields.length > 0) {
      const fieldList = blankFields.join(', ');
      response.status(400).json({error: `These fields cannot be blank: ${fieldList}`});
      return;
    }

    try {
      this.placeService.updatePlaces(placeinfo);
      response.status(200).json({status: 'success'});
    } catch (error) {
      console.log(error);
      response.status(400).json({error: 'An error occurred while updating the place'});
      return;
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
const roleAssignmentService = Container.get(RoleAssignmentService);
const objectInstanceService = Container.get(ObjectInstanceService);
export const adminController = new AdminController(
  adminService, memberService, avatarService, placeService, roleAssignmentService, objectInstanceService);
