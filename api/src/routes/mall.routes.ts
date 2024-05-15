import Router from 'express';

import { mallController } from '../controllers';

/**
 * This file sets up routing for home routes.
 * @note All paths used here will be prepended with `/api/home`.
 */

const mallRoutes = Router();
mallRoutes.get('/can_admin', (request, response) => mallController.canAdmin(request, response));
mallRoutes.get('/pending_approval', (request, response) =>
  mallController.objectsPendingApproval(request, response),
);
mallRoutes.get('/stores', (request, response)  => mallController.findStores(request,response));
mallRoutes.post('/approve', (request, response) => mallController.approveObject(request, response));
mallRoutes.post('/reject', (request, response) => mallController.rejectObject(request, response));
mallRoutes.get('/objects/:id', (request, response) =>
  mallController.objectsForSale(request, response),
);
mallRoutes.get('/object/:id', (request, response) => 
  mallController.findByObjectId(request, response));
mallRoutes.post('/:id/position', (request, response) => 
  mallController.updateObjectPosition(request, response));
mallRoutes.post('/buy', (request, response) => mallController.buyObject(request, response));

export { mallRoutes };
