import Router from 'express';
import {adminController} from '../controllers';

const adminRoutes = Router();
adminRoutes.post('/search', (request, response) =>
  adminController.searchUsers(request, response));
adminRoutes.post('/userchat', (request, response) =>
  adminController.searchUserChat(request, response));

export {adminRoutes};
