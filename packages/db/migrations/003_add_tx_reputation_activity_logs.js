/* eslint-disable */
exports.up = async function (knex) {
  await knex.schema.alterTable('transactions', (t) => {
    t.string('tx_id').unique();
    t.string('requester_id');
  });

  await knex.schema.alterTable('providers', (t) => {
    t.integer('reputation').defaultTo(0);
  });

  await knex.schema.alterTable('activity_logs', (t) => {
    t.renameColumn('action', 'type');
    t.renameColumn('metadata', 'meta_json');
    t.text('message');
    t.dropColumn('user_id');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('activity_logs', (t) => {
    t.uuid('user_id');
    t.renameColumn('type', 'action');
    t.renameColumn('meta_json', 'metadata');
    t.dropColumn('message');
  });

  await knex.schema.alterTable('providers', (t) => {
    t.dropColumn('reputation');
  });

  await knex.schema.alterTable('transactions', (t) => {
    t.dropColumn('tx_id');
    t.dropColumn('requester_id');
  });
};
