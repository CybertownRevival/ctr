import { Service } from 'typedi';

import sanitizeHtml from 'sanitize-html';

import { NewsRepository } from '../../repositories/news/news.repository';

@Service()
export class NewsService {
  constructor(
    private newsRepository: NewsRepository,
  ) {}

  public async sanitize(
    html: string,
  ): Promise<string> {
    return sanitizeHtml(html);
  }

  public async getNews(): Promise<any> {
    return this.newsRepository.getNews();
  }

  public async updateNews(
    html: string,
    memberId: number,
  ): Promise<void> {
    return this.newsRepository.updateNews(
      html,
      memberId,
    );
  }
}