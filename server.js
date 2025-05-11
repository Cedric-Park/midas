const app = require('./src/expressApp');
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
