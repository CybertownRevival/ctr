import Router from 'express';

import { blackmarketController } from '../controllers';


const blackmarketRoutes = Router();
blackmarketRoutes.get('/can_admin', (request, response) => 
  blackmarketController.canAdmin(request, response));

export { blackmarketRoutes };
