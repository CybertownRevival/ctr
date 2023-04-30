import Router from 'express';

import { messageboardController } from '../controllers';

const messageboardRoutes = Router();

messageboardRoutes.post('/changemessageboardintro/',
  (request, response) => messageboardController.changeMessageboardIntro(request, response));
messageboardRoutes.post('/deletemessage/',
  (request, response) => messageboardController.deleteMessageboardMessage(request, response));
messageboardRoutes.post('/info/',
  (request, response) => messageboardController.getInfo(request, response));
messageboardRoutes.post('/getadmininfo/',
  (request, response) => messageboardController.getAdminInfo(request, response));
messageboardRoutes.post('/getmessage/',
  (request, response) => messageboardController.getMessage(request, response));
messageboardRoutes.post('/messages/',
  (request, response) => messageboardController.getMessageboardMessages(request, response));
messageboardRoutes.post('/postmessage/',
  (request, response) => messageboardController.postMessageboardMessage(request, response));
messageboardRoutes.post('/postreply/',
  (request, response) => messageboardController.postMessageboardReply(request, response));

export { messageboardRoutes };
