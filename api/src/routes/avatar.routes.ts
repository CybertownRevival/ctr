import Router from 'express';

import { avatarController} from '../controllers';

const avatarRoutes = Router();

avatarRoutes.get('', (request, response) => avatarController.getResults(request, response));
avatarRoutes.post('/upload', (request, response) => avatarController.add(request, response));

export { avatarRoutes };
