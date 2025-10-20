/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // Full-text search index on posts.content
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_posts_content_gin
      ON posts USING GIN (to_tsvector('english', content));
    `);
  
    // Full-text search index on reflection_daily_messages.content
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_reflections_content_gin
      ON reflection_daily_messages USING GIN (to_tsvector('english', content));
    `);
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export async function down(knex) {
    await knex.raw(`
      DROP INDEX IF EXISTS idx_posts_content_gin;
    `);
  
    await knex.raw(`
      DROP INDEX IF EXISTS idx_reflections_content_gin;
    `);
  }