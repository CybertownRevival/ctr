import { Router } from 'express';

import { fundboxController } from '../controllers';

const fundboxRoutes = Router();

fundboxRoutes.post('/donate', (request, response) =>
  fundboxController.donate(request, response));

export { fundboxRoutes };
