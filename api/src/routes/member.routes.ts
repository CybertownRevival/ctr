import Router, {request, response} from 'express';

import { memberController } from '../controllers';

/**
 * This file sets up routing for member routes.
 * @note All paths used here will be prepended with `/api/member`.
 */

const memberRoutes = Router();
memberRoutes.post('/signup', (request, response) => memberController.signup(request, response));
memberRoutes.post('/is_banned',
  (request, response) => memberController.isBanned(request, response));
memberRoutes.post('/login', (request, response) => memberController.login(request, response));
memberRoutes.get('/session', (request, response) => memberController.session(request, response));
memberRoutes.post('/update_password',
  (request, response) => memberController.updatePassword(request, response));
memberRoutes.post('/update_avatar',
  (request, response) => memberController.updateAvatar(request, response));
memberRoutes.post('/send_password_reset',
  (request, response) => memberController.sendPasswordReset(request, response));
memberRoutes.post('/reset_password',
  (request, response) => memberController.resetPassword(request, response));
memberRoutes.get('/info',
  (request, response) => memberController.getInfo(request, response));
memberRoutes.get('/info/:id',
  (request, response) => memberController.getInfo(request, response));

export { memberRoutes };
