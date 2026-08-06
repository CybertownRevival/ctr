import { Request, Response } from 'express';
import { Container } from 'typedi';

import {
  MemberService,
  NewsService,
} from '../services';

class NewsController {
  constructor(
    private memberService: MemberService,
    private newsService: NewsService,
  ) {}

  public async getNews(
    request: Request,
    response: Response,
  ): Promise<void> {
    try {
      const news = await this.newsService.getNews();

      response.status(200).json({
        news: news || null,
      });
    } catch (error) {
      console.log(error);

      response.status(400).json({
        error: 'A problem occurred while trying to fetch the News page.',
      });
    }
  }

  public async updateNews(
    request: Request,
    response: Response,
  ): Promise<void> {
    const session = this.memberService.decryptSession(
      request,
      response,
    );

    if (!session) {
      return;
    }

    const accessLevel = await this.memberService.getAccessLevel(
      session.id,
    );

    if (!accessLevel.includes('admin')) {
      response.status(403).json({
        error: 'Access Denied',
      });

      return;
    }

    const uncleanHtml = request.body.html;

    if (typeof uncleanHtml !== 'string') {
      response.status(400).json({
        error: 'News HTML is required.',
      });

      return;
    }

    const cleanHtml = await this.newsService.sanitize(
      uncleanHtml,
    );

    try {
      await this.newsService.updateNews(
        cleanHtml,
        session.id,
      );

      response.status(200).json({
        success: 'News updated',
      });
    } catch (error) {
      console.log(error);

      response.status(400).json({
        error: 'A problem occurred while trying to update the News page.',
      });
    }
  }
}

const memberService = Container.get(MemberService);
const newsService = Container.get(NewsService);

export const newsController = new NewsController(
  memberService,
  newsService,
);