import Router from 'express';
import {adminController} from '../controllers';

const adminRoutes = Router();
adminRoutes.post('/addban', (request, response) =>
  adminController.addBan(request, response));
adminRoutes.get('/getbanhistory/:ban_member_id', (request, response) =>
  adminController.getBanHistory(request, response));
adminRoutes.post('/search', (request, response) =>
  adminController.searchUsers(request, response));
adminRoutes.post('/userchat', (request, response) =>
  adminController.searchUserChat(request, response));

export {adminRoutes};
