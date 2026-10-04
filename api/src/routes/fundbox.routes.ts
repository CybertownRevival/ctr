import { Router } from 'express';

import { fundboxController } from '../controllers';

const fundboxRoutes = Router();

fundboxRoutes.get('/audit', (request, response) =>
  fundboxController.getAuditFundboxes(request, response));

fundboxRoutes.get('/:id', (request, response) =>
  fundboxController.getFundbox(request, response));

fundboxRoutes.get('/:id/transactions', (request, response) =>
  fundboxController.getTransactions(request, response));

fundboxRoutes.post('/donate', (request, response) =>
  fundboxController.donate(request, response));

fundboxRoutes.post('/award', (request, response) =>
  fundboxController.award(request, response));

export { fundboxRoutes };
