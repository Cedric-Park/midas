const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 트랜잭션 시작
  db.prepare('BEGIN TRANSACTION').run();

  // members 테이블에 shared_with 컬럼 추가
  db.prepare(`
    ALTER TABLE members ADD COLUMN shared_with TEXT DEFAULT '[]'
  `).run();

  // members 테이블에 depends_on 컬럼 추가
  db.prepare(`
    ALTER TABLE members ADD COLUMN depends_on TEXT
  `).run();

  // 트랜잭션 커밋
  db.prepare('COMMIT').run();
  console.log('shared_with와 depends_on 컬럼이 성공적으로 추가되었습니다.');
} catch (error) {
  // 에러 발생 시 롤백
  db.prepare('ROLLBACK').run();
  console.error('마이그레이션 중 오류 발생:', error);
} finally {
  db.close();
} 