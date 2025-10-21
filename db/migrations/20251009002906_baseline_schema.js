/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    await knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.text('username').notNullable();
        table.text('email').notNullable();
        table.text('password').notNullable();
        table.text('role').notNullable().defaultTo('user');
        table.text('name');
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.check('char_length(username) >= 3 AND char_length(username) <= 32');
        table.check("role IN ('user', 'admin')");
        table.unique(knex.raw('LOWER(username)'), { indexName: 'users_username_lower_uniq' });
        table.unique(knex.raw('LOWER(email)'), { indexName: 'users_email_lower_uniq' });
        table.unique('email', { indexName: 'users_email_key' });
    });

    await knex.schema.createTable('posts', (table) => {
        table.increments('id').primary();
        table.text('title').notNullable();
        table.text('content').notNullable();
        table.integer('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.text('image_url');
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.index(['author_id'], 'idx_posts_author_id');
        table.index(['created_at'], 'idx_posts_created_at');
    });

    await knex.schema.createTable('comments', (table) => {
        table.increments('id').primary();
        table.integer('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.text('content').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.check('char_length(content) >= 1 AND char_length(content) <= 5000');
        table.index(['post_id', 'created_at'], 'idx_comments_post_id_created');
        table.index(['user_id'], 'idx_comments_user_id');
    });

    await knex.schema.createTable('contact_messages', (table) => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.string('email', 255).notNullable();
        table.text('message').notNullable();
        table.specificType('client_ip', 'inet');
        table.text('user_agent');
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('sections', (table) => {
        table.increments('id').primary();
        table.text('slug').notNullable();
        table.text('title').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.unique(['slug'], { indexName: 'sections_slug_key' });
        table.unique(knex.raw('LOWER(slug)'), { indexName: 'sections_slug_uniq' });
    });

    await knex.schema.createTable('content_blocks', (table) => {
        table.increments('id').primary();
        table.integer('section_id').notNullable().references('id').inTable('sections').onDelete('CASCADE');
        table.text('title');
        table.text('body').notNullable();
        table.text('image_url');
        table.integer('order_index').notNullable().defaultTo(0);
        table.boolean('published').notNullable().defaultTo(true);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.index(['section_id', 'order_index', 'created_at'], 'idx_blocks_section_order');
    });

    await knex.schema.createTable('reflection_prompts', (table) => {
        table.increments('id').primary();
        table.text('text').notNullable();
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('reflection_daily_prompts', (table) => {
        table.increments('id').primary();
        table.integer('prompt_id').notNullable().references('id').inTable('reflection_prompts').onDelete('CASCADE');
        table.date('active_on').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.unique(['active_on'], { indexName: 'reflection_daily_prompts_active_on_key' });
        table.index(['active_on'], 'idx_reflection_daily_prompts_active_on');
        table.index(['prompt_id'], 'idx_reflection_daily_prompts_prompt');
    });

    await knex.schema.createTable('reflection_daily_messages', (table) => {
        table.increments('id').primary();
        table.integer('daily_id').notNullable().references('id').inTable('reflection_daily_prompts').onDelete('CASCADE');
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.text('username');
        table.text('content').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.check('char_length(content) >= 1 AND char_length(content) <= 2000');
        table.index(['daily_id', 'created_at'], 'idx_reflection_daily_messages_daily_created');
        table.index(['daily_id'], 'idx_reflection_daily_messages_daily');
        table.index(['user_id'], 'idx_reflection_daily_messages_user');
    });

    // -------------------
    // QUOTES + WEEKLY CHAT
    // -------------------

    await knex.schema.createTable('quotes', (table) => {
        table.increments('id').primary();
        table.text('text').notNullable();
        table.text('author');
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('weekly_quotes', (table) => {
        table.increments('id').primary();
        table.integer('quote_id').notNullable().references('id').inTable('quotes').onDelete('CASCADE');
        table.date('active_week').notNullable().unique();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.index(['active_week'], 'idx_weekly_quotes_active_week');
        table.index(['quote_id'], 'idx_weekly_quotes_quote_id');
    });

    await knex.schema.createTable('weekly_quote_messages', (table) => {
        table.increments('id').primary();
        table.integer('weekly_id').notNullable().references('id').inTable('weekly_quotes').onDelete('CASCADE');
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.text('username');
        table.text('content').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.check('char_length(content) >= 1 AND char_length(content) <= 2000');
        table.index(['weekly_id', 'created_at'], 'idx_weekly_quote_messages_weekly_created');
        table.index(['user_id'], 'idx_weekly_quote_messages_user');
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('weekly_quote_messages');
    await knex.schema.dropTableIfExists('weekly_quotes');
    await knex.schema.dropTableIfExists('quotes');
    await knex.schema.dropTableIfExists('reflection_daily_messages');
    await knex.schema.dropTableIfExists('reflection_daily_prompts');
    await knex.schema.dropTableIfExists('reflection_prompts');
    await knex.schema.dropTableIfExists('content_blocks');
    await knex.schema.dropTableIfExists('sections');
    await knex.schema.dropTableIfExists('contact_messages');
    await knex.schema.dropTableIfExists('comments');
    await knex.schema.dropTableIfExists('posts');
    await knex.schema.dropTableIfExists('users');
}