import Router from 'express';

import { liveEventController } from '../controllers';

const liveEventRoutes = Router();

liveEventRoutes.get('/', (request, response) =>
  liveEventController.getCurrent(request, response));

liveEventRoutes.post('/', (request, response) =>
  liveEventController.update(request, response));

export { liveEventRoutes };
