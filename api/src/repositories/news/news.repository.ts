import { Service } from 'typedi';

import { knex } from '../../db';

@Service()
export class NewsRepository {
  public async getNews(): Promise<any> {
    return knex('news')
      .leftJoin(
        'member',
        'news.updated_by_member_id',
        'member.id',
      )
      .select(
        'news.id',
        'news.html',
        'news.updated_by_member_id',
        'news.created_at',
        'news.updated_at',
        'member.username as updated_by_username',
      )
      .first();
  }

  public async updateNews(
    html: string,
    memberId: number,
  ): Promise<void> {
    const existingNews = await knex('news').first();

    if (existingNews) {
      await knex('news')
        .where('id', existingNews.id)
        .update({
          html,
          updated_by_member_id: memberId,
          updated_at: knex.fn.now(),
        });

      return;
    }

    await knex('news').insert({
      html,
      updated_by_member_id: memberId,
    });
  }
}
