import Router from 'express';

import { fleamarketController } from '../controllers';

/**
 * This file sets up routing for home routes.
 * @note All paths used here will be prepended with `/api/home`.
 */

const fleamarketRoutes = Router();
fleamarketRoutes.get('/can_admin', (request, response) => 
  fleamarketController.canAdmin(request, response));

export { fleamarketRoutes };
