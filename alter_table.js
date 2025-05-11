const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 테이블 구조 변경
  db.prepare(
    `
    ALTER TABLE patients 
    ADD COLUMN notes TEXT DEFAULT ''
  `
  ).run();

  console.log('notes 컬럼이 추가되었습니다.');
} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
}
