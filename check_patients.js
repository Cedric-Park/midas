const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 환자 정보 조회
  const patients = db.prepare(`
    SELECT * FROM patients 
    WHERE name IN ('강송녀', '강선희')
  `).all();

  console.log('환자 정보:', patients);

} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
} 