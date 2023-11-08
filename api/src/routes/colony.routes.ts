import Router from 'express';

import {colonyController} from '../controllers';

const colonyRoutes = Router();

colonyRoutes.get('/:slug/hoods', (request, response) =>
  colonyController.getHoods(request, response),
);
colonyRoutes.get('/:id/can_admin', (request, response) =>
  colonyController.canAdmin(request, response),
);

colonyRoutes.get('/:id/can_manage_access', (request, response) =>
  colonyController.canManageAccess(request, response),
);
colonyRoutes.get('/:id/getAccessInfo', (request, response) =>
  colonyController.getAccessInfoByUsername(request, response),
);
colonyRoutes.post('/:id/postAccessInfo', (request, response) =>
  colonyController.postAccessInfo(request, response),
);

export { colonyRoutes };
