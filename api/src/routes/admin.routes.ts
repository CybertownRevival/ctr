import Router from 'express';
import {adminController} from '../controllers';

const adminRoutes = Router();
adminRoutes.post('/search', (request, response) =>
  adminController.searchUsers(request, response));

export {adminRoutes};
