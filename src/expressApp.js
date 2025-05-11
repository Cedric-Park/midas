const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// API 라우터 연결
app.use('/api', routes);

// 에러 핸들링 미들웨어
app.use(errorHandler);

module.exports = app; 