/* eslint-disable */
exports.up = async function (knex) {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary();
    t.string('email').notNullable().unique();
    t.string('name');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('providers', (t) => {
    t.uuid('id').primary();
    t.string('name').notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('data_packages', (t) => {
    t.uuid('id').primary();
    t.uuid('provider_id').references('id').inTable('providers').onDelete('CASCADE');
    t.string('title').notNullable();
    t.text('description');
    t.decimal('price', 12, 2).notNullable();
    t.jsonb('tags').defaultTo('[]');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('transactions', (t) => {
    t.uuid('id').primary();
    t.uuid('user_id').references('id').inTable('users');
    t.uuid('provider_id').references('id').inTable('providers');
    t.uuid('package_id').references('id').inTable('data_packages');
    t.string('status').notNullable();
    t.decimal('amount', 12, 2).notNullable();
    t.string('currency').defaultTo('ICP');
    t.string('tx_hash');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('network_nodes', (t) => {
    t.uuid('id').primary();
    t.string('address').notNullable();
    t.integer('latency_ms');
    t.boolean('is_online').defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('activity_logs', (t) => {
    t.increments('id').primary();
    t.uuid('user_id');
    t.string('action').notNullable();
    t.jsonb('metadata').defaultTo('{}');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('activity_logs');
  await knex.schema.dropTableIfExists('network_nodes');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('data_packages');
  await knex.schema.dropTableIfExists('providers');
  await knex.schema.dropTableIfExists('users');
};
