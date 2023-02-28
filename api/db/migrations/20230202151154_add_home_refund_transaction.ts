import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log('adding home-refund reason to transaction table');
  await knex.schema.raw("ALTER TABLE `transaction` CHANGE COLUMN `reason` `reason`" +
    " ENUM('daily-credit'," +
    " 'home-purchase', 'item-purchase', 'member-to-member', 'system-to-member', 'home-refund') NOT NULL");
}


export async function down(knex: Knex): Promise<void> {
  console.log('removing home-refund reason from transaction table');
  await knex.schema.raw("ALTER TABLE `transaction` CHANGE COLUMN `reason` `reason`" +
    " ENUM('daily-credit'," +
    " 'home-purchase', 'item-purchase', 'member-to-member', 'system-to-member') NOT NULL");
}

