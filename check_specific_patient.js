const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 강송녀 환자 정보 조회
  const patient = db.prepare(`
    SELECT * FROM patients 
    WHERE name = '강송녀'
  `).get();

  console.log('강송녀 환자 정보:');
  console.log(patient);

} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
} 