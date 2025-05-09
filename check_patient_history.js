const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 환자들의 모든 치료 기록 조회
  const records = db.prepare(`
    SELECT th.*, p.name 
    FROM treatmentHistory th 
    JOIN patients p ON th.patientId = p.id 
    WHERE p.name IN ('강송녀', '강선희')
    ORDER BY th.date DESC
  `).all();

  console.log('치료 기록:', records);

} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
} 