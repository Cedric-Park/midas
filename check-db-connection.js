const db = require('better-sqlite3')('midas.db');

try {
  // 데이터베이스 연결 확인
  console.log('데이터베이스 연결 성공');

  // members 테이블 확인
  const members = db.prepare('SELECT * FROM members').all();
  console.log('\n회원 수:', members.length);
  console.log('첫 번째 회원:', members[0]);

  // sessionHistory 테이블 확인
  const sessions = db.prepare('SELECT * FROM sessionHistory').all();
  console.log('\n세션 내역 수:', sessions.length);
  console.log('첫 번째 세션:', sessions[0]);

  // knex_migrations 테이블 확인
  const migrations = db.prepare('SELECT * FROM knex_migrations').all();
  console.log('\n마이그레이션 상태:', migrations);

} catch (error) {
  console.error('데이터베이스 확인 중 오류 발생:', error);
} finally {
  db.close();
} 