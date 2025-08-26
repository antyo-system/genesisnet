/* eslint-env node, commonjs */
/* eslint-disable no-undef */
/** @type {import('knex').Knex.Config} */
module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/genesisnet',
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};
