const knex = require('knex');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

db.on('query', queryData => {
  console.log('[KNEX SQL]', queryData.sql, queryData.bindings);
});

module.exports = db; 