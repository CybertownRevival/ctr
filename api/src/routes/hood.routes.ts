import Router from 'express';

import { hoodController } from '../controllers';

const hoodRoutes = Router();

hoodRoutes.get('/:id/blocks',
  (request, response) => hoodController.getBlocks(request, response));
hoodRoutes.get('/:id',
  (request, response) => hoodController.getHood(request, response));

export { hoodRoutes };
