import Router from 'express';

import { placeController } from '../controllers';

const placeRoutes = Router();
placeRoutes.get('/:slug/object_instance',
  (request, response) => placeController.getPlaceObjects(request, response));
placeRoutes.get('/:slug',
  (request, response) => placeController.getPlace(request, response));

export { placeRoutes };
