/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    await knex.schema.createTable('weekly_quotes', (table) => {
      table.increments('id').primary();
      table.text('text').notNullable();
      table.text('author');
      table.boolean('is_active').notNullable().defaultTo(true);
      table.date('used_on').unique(); // ensures one quote per week
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export async function down(knex) {
    await knex.schema.dropTableIfExists('weekly_quotes');
  }