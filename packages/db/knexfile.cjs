/** @type {import('knex').Knex.Config} */
module.exports = {
  client: 'pg',
  connection: process.env.DB_URL || 'postgres://postgres:postgres@localhost:5432/genesisnet',
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  },
  pool: {
    min: 2,
    max: 10
  }
};
