import {Request, Response} from 'express';
import { Container } from 'typedi';

import { AdminService, MemberService } from '../services';

class AdminController {
  constructor(private adminService: AdminService, private memberService: MemberService) {}
  
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
    const admin = await this.memberService.canAdmin(session.id);
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
  
  public async searchUsers(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.canAdmin(session.id);
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
    const admin = await this.memberService.canAdmin(session.id);
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
}

const adminService = Container.get(AdminService);
const memberService = Container.get(MemberService);
export const adminController = new AdminController(adminService, memberService);
