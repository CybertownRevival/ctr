import Router from 'express';

import { blackmarketController } from '../controllers';

/**
 * This file sets up routing for home routes.
 * @note All paths used here will be prepended with `/api/home`.
 */

const blackmarketRoutes = Router();
blackmarketRoutes.get('/can_admin', (request, response) => 
  blackmarketController.canAdmin(request, response));

export { blackmarketRoutes };
