/* eslint-disable */
exports.seed = async function (knex) {
  await knex('activity_logs').del();
  await knex('transactions').del();
  await knex('data_packages').del();
  await knex('providers').del();
  await knex('users').del();

  await knex('users').insert([{ id: 'user_1', email: 'user1@example.com', name: 'User One' }]);

  await knex('providers').insert([{ id: 'provider_1', name: 'Provider One' }]);

  await knex('data_packages').insert([
    {
      id: 'pkg_1',
      provider_id: 'provider_1',
      title: 'Sample Data',
      description: 'Initial seed data',
      price: 10,
      tags: JSON.stringify(['sample']),
    },
  ]);
};
