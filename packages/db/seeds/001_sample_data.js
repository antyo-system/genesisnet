/* eslint-env node, commonjs */
/* eslint-disable no-undef */
/**
 * Seed initial data
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  await knex('transactions').del();
  await knex('data_packages').del();
  await knex('providers').del();
  await knex('users').del();
  await knex('network_nodes').del();
  await knex('activity_logs').del();

  const [user] = await knex('users')
    .insert({
      email: 'user@example.com',
      password_hash: 'hashed_password',
      role: 'user',
      wallet_address: '0xuser',
    })
    .returning('id');
  const userId = user.id || user;

  const [provider] = await knex('providers')
    .insert({
      name: 'Provider One',
      rating: 5,
      wallet_address: '0xprovider',
    })
    .returning('id');
  const providerId = provider.id || provider;

  const [pkg] = await knex('data_packages')
    .insert({
      provider_id: providerId,
      name: 'Starter Pack',
      category: 'general',
      price: 9.99,
      rating: 5,
    })
    .returning('id');
  const packageId = pkg.id || pkg;

  await knex('transactions').insert({
    user_id: userId,
    provider_id: providerId,
    package_id: packageId,
    amount: 9.99,
    status: 'completed',
    tx_hash: '0xtxhash',
  });

  await knex('network_nodes').insert({
    host: 'node1.example.com',
    status: 'online',
    latency_ms: 42,
  });

  await knex('activity_logs').insert({
    level: 'info',
    msg: 'Initial seed data inserted',
  });
};
