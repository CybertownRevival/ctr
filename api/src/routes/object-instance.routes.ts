import Router from 'express';

import { objectInstanceController } from '../controllers';

const objectInstanceRoutes = Router();
objectInstanceRoutes.post('/:id/position', (request, response) =>
  objectInstanceController.updateObjectInstancePosition(request, response),
);
objectInstanceRoutes.post('/:id/drop', (request, response) =>
  objectInstanceController.dropObjectInstance(request, response),
);
objectInstanceRoutes.post('/:id/pickup', (request, response) =>
  objectInstanceController.pickUpObjectInstance(request, response),
);

export { objectInstanceRoutes };
