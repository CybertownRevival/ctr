import { Router } from 'express';

import { fundboxController } from '../controllers';

const fundboxRoutes = Router();

fundboxRoutes.post('/donate', (request, response) =>
  fundboxController.donate(request, response));

fundboxRoutes.post('/award', (request, response) =>
  fundboxController.award(request, response));

export { fundboxRoutes };
