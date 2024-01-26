import Router from 'express';
import {adminController} from '../controllers';

const adminRoutes = Router();
adminRoutes.post('/ban', (request, response) =>
  adminController.addBan(request, response));
adminRoutes.post('/donor', (request, response) =>
  adminController.addDonor(request, response));
adminRoutes.post('/deleteban', (request, response) =>
  adminController.deleteBan(request, response));
adminRoutes.get('/banhistory', (request, response) =>
  adminController.getBanHistory(request, response));
adminRoutes.get('/donor', (request, response) =>
  adminController.getDonor(request, response));
adminRoutes.get('/usersearch', (request, response) =>
  adminController.searchUsers(request, response));
adminRoutes.get('/userchat', (request, response) =>
  adminController.searchUserChat(request, response));

export {adminRoutes};
