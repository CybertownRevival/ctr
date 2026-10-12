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
    return sanitizeHtml(html, {
      allowedTags: [
        'h1',
        'h2',
        'h3',
        'p',
        'div',
        'span',
        'b',
        'strong',
        'i',
        'img',
        'em',
        'u',
        's',
        'br',
        'hr',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
      ],
      allowedAttributes: {
        '*': ['style'],
        'a': ['href', 'target'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
      },
      allowedStyles: {
        '*': {
          color: [
           /^#[0-9a-fA-F]{3,6}$/,
           /^[a-zA-Z]+$/,
          ],
          'text-align': [
           /^left$/,
           /^center$/,
           /^right$/,
          ],
          'font-style': [
           /^normal$/,
           /^italic$/,
          ],
          'font-weight': [
           /^normal$/,
           /^bold$/,
           /^[1-9]00$/,
          ],
        },
      },
      allowedSchemes: [
        'http',
        'https',
      ],
    });
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