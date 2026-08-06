import { Router } from 'express';

import { newsController } from '../controllers/news.controller';

export const newsRoutes = Router();

newsRoutes.get(
  '/',
  (request, response) =>
    newsController.getNews(request, response),
);

newsRoutes.put(
  '/',
  (request, response) =>
    newsController.updateNews(request, response),
);