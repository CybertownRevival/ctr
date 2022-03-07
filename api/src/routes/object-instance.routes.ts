import Router from 'express';

import { objectInstanceController } from '../controllers';

const objectInstanceRoutes = Router();
objectInstanceRoutes.post('/:id/position',
  (request, response) => objectInstanceController.updateObjectInstancePosition(request, response));

export { objectInstanceRoutes };
