const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // patients 테이블 구조 확인
  const tableInfo = db.prepare(`
    PRAGMA table_info(patients)
  `).all();

  console.log('patients 테이블 구조:');
  console.log(tableInfo);

  // appointments 테이블 구조 확인
  const appointmentsInfo = db.prepare(`
    PRAGMA table_info(appointments)
  `).all();

  console.log('\nappointments 테이블 구조:');
  console.log(appointmentsInfo);

} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
} 