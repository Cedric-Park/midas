const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 업데이트된 환자 정보 샘플 조회
  const patients = db.prepare(`
    SELECT id, name, birthDate, joinDate, notes 
    FROM patients 
    LIMIT 5
  `).all();

  console.log('업데이트된 환자 정보 샘플:');
  console.log(patients);

} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
} 