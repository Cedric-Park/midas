const knex = require('knex');
const path = require('path');

const config = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../midas.db')
  },
  useNullAsDefault: true
};

module.exports = knex(config); 