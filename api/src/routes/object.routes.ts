import Router from 'express';

import { objectController } from '../controllers';

const objectRoutes = Router();
objectRoutes.post('/add', (request, response) => objectController.add(request, response));
objectRoutes.post('/increase_quantity', (request, response) => 
  objectController.increaseQuantity(request, response));
objectRoutes.get('/getObject/:id', (request, response) => 
  objectController.getObject(request, response));

export { objectRoutes };
