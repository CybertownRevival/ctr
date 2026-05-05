import Router from 'express';

import { avatarController} from '../controllers';

const avatarRoutes = Router();

avatarRoutes.get('', (request, response) => avatarController.getResults(request, response));
avatarRoutes.get('/remove_all_avatars', (request, response) => 
  avatarController.removeAllAvatars(request, response));
avatarRoutes.post('/upload', (request, response) => avatarController.add(request, response));

export { avatarRoutes };
