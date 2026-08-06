import { Service } from 'typedi';

import { knex } from '../../db';

@Service()
export class NewsRepository {
  public async getNews(): Promise<any> {
    return knex('news').first();
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