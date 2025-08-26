/* eslint-env node, commonjs */
/* eslint-disable no-undef */
/**
 * Create core tables
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.text('email').notNullable().unique();
    table.text('password_hash').notNullable();
    table.text('role').notNullable();
    table.text('wallet_address');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('providers', (table) => {
    table.bigIncrements('id').primary();
    table.text('name').notNullable();
    table.decimal('rating').defaultTo(0);
    table.text('wallet_address');
    table.jsonb('meta_json').notNullable().defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('data_packages', (table) => {
    table.bigIncrements('id').primary();
    table
      .bigInteger('provider_id')
      .notNullable()
      .references('id')
      .inTable('providers')
      .onDelete('CASCADE');
    table.text('name').notNullable();
    table.text('category');
    table.decimal('price').notNullable();
    table.decimal('rating').defaultTo(0);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.jsonb('meta_json').notNullable().defaultTo('{}');
  });

  await knex.schema.createTable('transactions', (table) => {
    table.bigIncrements('id').primary();
    table
      .bigInteger('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table
      .bigInteger('provider_id')
      .notNullable()
      .references('id')
      .inTable('providers')
      .onDelete('RESTRICT');
    table
      .bigInteger('package_id')
      .notNullable()
      .references('id')
      .inTable('data_packages')
      .onDelete('RESTRICT');
    table.decimal('amount').notNullable();
    table.text('status').notNullable();
    table.text('tx_hash');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('network_nodes', (table) => {
    table.bigIncrements('id').primary();
    table.text('host').notNullable();
    table.text('status').notNullable();
    table.integer('latency_ms');
    table.timestamp('last_seen_at', { useTz: true });
    table.jsonb('meta_json').notNullable().defaultTo('{}');
  });

  await knex.schema.createTable('activity_logs', (table) => {
    table.bigIncrements('id').primary();
    table.timestamp('ts', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.text('level').notNullable();
    table.text('msg').notNullable();
    table.jsonb('meta_json').notNullable().defaultTo('{}');
  });
};

/**
 * Drop core tables
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('activity_logs');
  await knex.schema.dropTableIfExists('network_nodes');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('data_packages');
  await knex.schema.dropTableIfExists('providers');
  await knex.schema.dropTableIfExists('users');
};
