import Router from 'express';

import { objectController } from '../controllers';

const objectRoutes = Router();
objectRoutes.post('/add', (request, response) => objectController.add(request, response));

export { objectRoutes };
