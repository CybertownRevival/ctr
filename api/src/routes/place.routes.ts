import Router from 'express';

import {placeController} from '../controllers';

const placeRoutes = Router();
placeRoutes.get('/:placeId/object_instance',
  (request, response) => placeController.getPlaceObjects(request, response));
placeRoutes.get('/:slug',
  (request, response) => placeController.getPlace(request, response));
placeRoutes.get('/:id',
  (request, response) => placeController.getPlaceById(request, response));
placeRoutes.post('/add_storage', (request, response) => 
  placeController.addStorage(request, response));

export { placeRoutes };
