import Router from 'express';

import {hoodController} from '../controllers';

const hoodRoutes = Router();

hoodRoutes.get('/:id/blocks', (request, response) => hoodController.getBlocks(request, response));
hoodRoutes.post('/:id/block/:blockId/status', (request, response) =>
  hoodController.updateBlockStatus(request, response),
);
hoodRoutes.post('/:id/block/:blockId/rename', (request, response) =>
  hoodController.renameBlock(request, response),
);
hoodRoutes.get('/:id', (request, response) => hoodController.getHood(request, response));
hoodRoutes.get('/:id/can_admin', (request, response) => hoodController.canAdmin(request, response));
hoodRoutes.get('/:id/can_rename_block', (request, response) =>
  hoodController.canRenameBlock(request, response),
);
hoodRoutes.get('/:id/can_manage_access', (request, response) =>
  hoodController.canManageAccess(request, response),
);
hoodRoutes.get('/:id/getAccessInfo', (request, response) =>
  hoodController.getAccessInfoByUsername(request, response),
);
hoodRoutes.post('/:id/postAccessInfo', (request, response) =>
  hoodController.postAccessInfo(request, response),
);
export { hoodRoutes };
