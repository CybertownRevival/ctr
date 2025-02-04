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
mallRoutes.get('/all_objects', (request, response)  => 
  mallController.findAllObjects(request,response));
mallRoutes.get('/soldout', (request, response)  => 
  mallController.findSoldOutObjects(request,response));
mallRoutes.get('/objectsearch', (request, response)  => 
  mallController.searchMallObjects(request,response));
mallRoutes.get('/allobjectsearch', (request, response)  => 
  mallController.searchAllObjects(request,response));
mallRoutes.post('/approve', (request, response) => mallController.approveObject(request, response));
mallRoutes.post('/reject', (request, response) => mallController.rejectObject(request, response));
mallRoutes.post('/refund', (request, response) => 
  mallController.refundUnsoldInstances(request, response));
mallRoutes.post('/limit', (request, response) => 
  mallController.updateObjectLimit(request, response));
mallRoutes.post('/updateObjectName', (request, response) => 
  mallController.updateObjectName(request, response));
mallRoutes.post('/drop', (request, response) => mallController.dropMallObject(request, response));
mallRoutes.post('/remove', (request, response) => 
  mallController.removeMallObject(request, response));
mallRoutes.post('/delete', (request, response) => 
  mallController.deleteMallObject(request, response));
mallRoutes.get('/objects/:id', (request, response) =>
  mallController.objectsForSale(request, response),
);
mallRoutes.get('/object/:id', (request, response) => 
  mallController.findByObjectId(request, response));
mallRoutes.get('/getObject/:id', (request, response) => 
  mallController.getObject(request, response));
mallRoutes.get('/store/:id', (request, response) => 
  mallController.findStore(request, response));
mallRoutes.post('/user', (request, response) => 
  mallController.findByUsername(request, response));
mallRoutes.post('/:id/position', (request, response) => 
  mallController.updateObjectPosition(request, response));
mallRoutes.post('/buy', (request, response) => mallController.buyObject(request, response));
mallRoutes.get('/object-catalog', (request, response) => 
  mallController.getObjectsCatalog(request, response));

export { mallRoutes };
