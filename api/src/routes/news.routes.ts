import { Router } from 'express';

import { newsController } from '../controllers/news.controller';

export const newsRoutes = Router();

newsRoutes.get(
  '/',
  (request, response) =>
    newsController.getNews(request, response),
);

newsRoutes.get(
  '/can-edit',
  (request, response) =>
    newsController.canEditNews(request, response),
);

newsRoutes.post(
  '/',
  (request, response) =>
    newsController.updateNews(request, response),
);