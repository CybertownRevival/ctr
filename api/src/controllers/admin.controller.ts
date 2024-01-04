import { Request, Response } from 'express';
import { Container } from 'typedi';

import { AdminService, MemberService } from '../services';

class AdminController {
  constructor(private adminService: AdminService, private memberService: MemberService) {}
  
  public async searchUsers(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.memberService.canAdmin(session.id);
    if (admin) {
      try {
        const results = await this.adminService.searchUsers(
          request.body.search,
          request.body.limit,
          request.body.offset,
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
          request.body.search,
          parseInt(request.body.user),
          request.body.limit,
          request.body.offset,
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
