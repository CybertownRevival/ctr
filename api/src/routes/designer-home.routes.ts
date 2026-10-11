import Router from 'express';

import { designerHomeController } from '../controllers';

/**
 * This file sets up routing for Designer Homes routes.
 * @note All paths used here will be prepended with `/api/designer_home`.
 */

const designerHomeRoutes = Router();
designerHomeRoutes.get('/can_admin', (request, response) =>
  designerHomeController.canAdmin(request, response));
designerHomeRoutes.get('/stores', (request, response) =>
  designerHomeController.getStores(request, response));
designerHomeRoutes.get('/store/:id', (request, response) =>
  designerHomeController.getStoreHomes(request, response));
designerHomeRoutes.get('/upload_status', (request, response) =>
  designerHomeController.getUploadStatus(request, response));
designerHomeRoutes.post('/upload', (request, response) =>
  designerHomeController.upload(request, response));
designerHomeRoutes.get('/preview/:id', (request, response) =>
  designerHomeController.getPreview(request, response));
designerHomeRoutes.post('/buy', (request, response) =>
  designerHomeController.buy(request, response));
designerHomeRoutes.get('/owned', (request, response) =>
  designerHomeController.getOwned(request, response));
designerHomeRoutes.get('/my_uploads', (request, response) =>
  designerHomeController.getMyUploads(request, response));

// staff
designerHomeRoutes.get('/pending', (request, response) =>
  designerHomeController.getPending(request, response));
designerHomeRoutes.get('/stocked', (request, response) =>
  designerHomeController.getStocked(request, response));
designerHomeRoutes.post('/approve', (request, response) =>
  designerHomeController.approve(request, response));
designerHomeRoutes.post('/move', (request, response) =>
  designerHomeController.move(request, response));
designerHomeRoutes.post('/remove', (request, response) =>
  designerHomeController.remove(request, response));
designerHomeRoutes.get('/settings', (request, response) =>
  designerHomeController.getSettings(request, response));
designerHomeRoutes.post('/upload_status', (request, response) =>
  designerHomeController.updateUploadStatus(request, response));
designerHomeRoutes.post('/ban', (request, response) =>
  designerHomeController.ban(request, response));
designerHomeRoutes.post('/unban', (request, response) =>
  designerHomeController.unban(request, response));

export { designerHomeRoutes };
