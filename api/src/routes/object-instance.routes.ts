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
objectInstanceRoutes.get('/:id/properties', (request, response) =>
  objectInstanceController.openObjectProperties(request, response),
);
objectInstanceRoutes.post('/update/', (request, response) =>
  objectInstanceController.updateObjectInstance(request, response),
);
objectInstanceRoutes.post('/buy/', (request, response) =>
  objectInstanceController.buyObjectInstance(request, response),
);
objectInstanceRoutes.post('/backpack', (request, response) =>
  objectInstanceController.moveToBackpack(request, response));

objectInstanceRoutes.post('/storage', (request, response) =>
  objectInstanceController.moveToStorage(request, response));

export { objectInstanceRoutes };
