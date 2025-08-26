/* eslint-disable */
exports.up = async function (knex) {
  await knex.schema.alterTable('data_packages', (table) => {
    table.index('provider_id');
    table.index('price');
  });
  await knex.raw('CREATE INDEX data_packages_tags_idx ON data_packages USING GIN (tags);');
  await knex.raw(
    "CREATE INDEX data_packages_search_idx ON data_packages USING GIN (to_tsvector('english', title || ' ' || coalesce(description, '')));",
  );
};

exports.down = async function (knex) {
  await knex.schema.alterTable('data_packages', (table) => {
    table.dropIndex('provider_id');
    table.dropIndex('price');
  });
  await knex.raw('DROP INDEX IF EXISTS data_packages_tags_idx;');
  await knex.raw('DROP INDEX IF EXISTS data_packages_search_idx;');
};
