require('dotenv').config();

module.exports = {
  database: {
    path: process.env.DB_PATH || 'midas.db',
    pragma: {
      journalMode: 'WAL',
      synchronous: 'NORMAL',
      tempStore: 'MEMORY',
      mmapSize: 30000000000,
      pageSize: 4096,
      cacheSize: -2000,
    },
  },
  server: {
    port: process.env.PORT || 3000,
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
    },
  },
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  },
};
