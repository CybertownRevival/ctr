import Router from 'express';

import { objectInstanceController } from '../controllers';

const objectInstanceRoutes = Router();
objectInstanceRoutes.post('/:id/position', (request, response) =>
  objectInstanceController.updateObjectInstancePosition(request, response),
);
objectInstanceRoutes.post('/:id/drop', (request, response) =>
  objectInstanceController.dropObjectInstance(request, response),
);

export { objectInstanceRoutes };
