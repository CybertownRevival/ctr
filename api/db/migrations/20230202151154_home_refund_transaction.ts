import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log('applying change');
  await knex.schema.raw("ALTER TABLE `transaction` CHANGE COLUMN `reason` `reason`" +
    " ENUM('daily-credit'," +
    " 'home-purchase', 'item-purchase', 'member-to-member', 'system-to-member', 'home-refund') NOT NULL");
}


export async function down(knex: Knex): Promise<void> {
  console.log('applying change');
  await knex.schema.raw("ALTER TABLE `transaction` CHANGE COLUMN `reason` `reason`" +
    " ENUM('daily-credit'," +
    " 'home-purchase', 'item-purchase', 'member-to-member', 'system-to-member') NOT NULL");
}

