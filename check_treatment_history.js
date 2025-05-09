const Database = require('better-sqlite3');
const db = new Database('midas.db');

try {
  // 진찰 내역 테이블 존재 여부 확인
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='treatmentHistory'
  `).all();
  
  console.log('테이블 확인:', tables);

  if (tables.length > 0) {
    // 진찰 내역 데이터 조회
    const history = db.prepare('SELECT * FROM treatmentHistory').all();
    console.log('\n진찰 내역 데이터:', history);
    
    // 환자별 진찰 내역 수 확인
    const countByPatient = db.prepare(`
      SELECT patientId, COUNT(*) as count 
      FROM treatmentHistory 
      GROUP BY patientId
    `).all();
    console.log('\n환자별 진찰 내역 수:', countByPatient);
  }
} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
} 