/* eslint-env node, commonjs */
/* eslint-disable no-undef */
/**
 * Add indexes for core tables
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users (wallet_address)');

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_providers_name ON providers (name)');
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_providers_wallet_address ON providers (wallet_address)',
  );

  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_data_packages_provider_id ON data_packages (provider_id)',
  );
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_data_packages_category ON data_packages (category)',
  );

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id)');
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_transactions_provider_id ON transactions (provider_id)',
  );
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_transactions_package_id ON transactions (package_id)',
  );
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status)');
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at)',
  );

  await knex.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_network_nodes_host ON network_nodes (host)',
  );
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_network_nodes_status ON network_nodes (status)');

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_activity_logs_ts ON activity_logs (ts)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_activity_logs_level ON activity_logs (level)');
};

/**
 * Drop indexes for core tables
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_activity_logs_level');
  await knex.raw('DROP INDEX IF EXISTS idx_activity_logs_ts');

  await knex.raw('DROP INDEX IF EXISTS idx_network_nodes_status');
  await knex.raw('DROP INDEX IF EXISTS idx_network_nodes_host');

  await knex.raw('DROP INDEX IF EXISTS idx_transactions_created_at');
  await knex.raw('DROP INDEX IF EXISTS idx_transactions_status');
  await knex.raw('DROP INDEX IF EXISTS idx_transactions_package_id');
  await knex.raw('DROP INDEX IF EXISTS idx_transactions_provider_id');
  await knex.raw('DROP INDEX IF EXISTS idx_transactions_user_id');

  await knex.raw('DROP INDEX IF EXISTS idx_data_packages_category');
  await knex.raw('DROP INDEX IF EXISTS idx_data_packages_provider_id');

  await knex.raw('DROP INDEX IF EXISTS idx_providers_wallet_address');
  await knex.raw('DROP INDEX IF EXISTS idx_providers_name');

  await knex.raw('DROP INDEX IF EXISTS idx_users_wallet_address');
};
