import Router from 'express';

import { colonyController } from '../controllers';

const colonyRoutes = Router();

colonyRoutes.get('/:slug/hoods', (request, response) =>
  colonyController.getHoods(request, response),
);
colonyRoutes.get('/:slug/can_admin', (request, response) =>
  colonyController.canAdmin(request, response),
);

colonyRoutes.get('/:slug/can_manage_access', (request, response) =>
  colonyController.canManageAccess(request, response),
);

export { colonyRoutes };
