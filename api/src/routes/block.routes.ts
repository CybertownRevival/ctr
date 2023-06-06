import Router from 'express';

import { blockController } from '../controllers';

const blockRoutes = Router();

blockRoutes.get('/:id/locations', (request, response) =>
  blockController.getLocations(request, response),
);
blockRoutes.get('/:id', (request, response) => blockController.getBlock(request, response));
blockRoutes.get('/:id/can_admin', (request, response) =>
  blockController.canAdmin(request, response),
);
blockRoutes.get('/:id/can_manage_access', (request, response) =>
  blockController.canManageAccess(request, response),
);
blockRoutes.post('/:id/locations', (request, response) =>
  blockController.postLocations(request, response),
);

export { blockRoutes };
