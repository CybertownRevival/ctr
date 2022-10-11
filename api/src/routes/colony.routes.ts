import Router from 'express';

import { colonyController } from '../controllers';

const colonyRoutes = Router();

colonyRoutes.get('/:slug/hoods',
  (request, response) => colonyController.getHoods(request, response));

export { colonyRoutes };
