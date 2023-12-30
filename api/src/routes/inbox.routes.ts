import Router from 'express';

import { inboxController } from '../controllers';

const inboxRoutes = Router();

inboxRoutes.post('/changemessageboardintro/',
  (request, response) => inboxController.changeMessageboardIntro(request, response));
inboxRoutes.post('/deletemessage/',
  (request, response) => inboxController.deleteInboxMessage(request, response));
inboxRoutes.post('/info/',
  (request, response) => inboxController.getInfo(request, response));
inboxRoutes.post('/getadmininfo/',
  (request, response) => inboxController.getAdminInfo(request, response));
inboxRoutes.post('/getmessage/',
  (request, response) => inboxController.getMessage(request, response));
inboxRoutes.post('/messages/',
  (request, response) => inboxController.getInboxMessages(request, response));
inboxRoutes.post('/postmessage/',
  (request, response) => inboxController.postInboxMessage(request, response));
inboxRoutes.post('/postreply/',
  (request, response) => inboxController.postInboxReply(request, response));

export { inboxRoutes };
