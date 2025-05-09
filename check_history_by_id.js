const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 환자 ID로 치료 기록 조회
  const records = db.prepare(`
    SELECT * FROM treatmentHistory 
    WHERE patientId IN ('1UBCJRC', 'DVW13OZ')
    ORDER BY date DESC
  `).all();

  console.log('치료 기록:', records);

} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
} 