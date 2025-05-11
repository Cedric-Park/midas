const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 전체 치료 기록 수 조회
  const count = db.prepare('SELECT COUNT(*) as count FROM treatmentHistory').get();
  console.log('전체 치료 기록 수:', count.count);

  // 최근 치료 기록 10개 샘플 조회
  const records = db
    .prepare(
      `
    SELECT th.*, p.name 
    FROM treatmentHistory th 
    JOIN patients p ON th.patientId = p.id 
    ORDER BY th.date DESC 
    LIMIT 10
  `
    )
    .all();

  console.log('\n최근 치료 기록 10개:', records);
} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
}
