const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  console.log('sessionHistory 테이블에 updated_at 컬럼 추가 중...');

  // updated_at 컬럼이 이미 존재하는지 확인
  const tableInfo = db.prepare("PRAGMA table_info(sessionHistory)").all();
  const hasUpdatedAt = tableInfo.some(column => column.name === 'updated_at');

  if (hasUpdatedAt) {
    console.log('updated_at 컬럼이 이미 존재합니다.');
  } else {
    // 트랜잭션 시작
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // updated_at 컬럼 추가
      db.prepare('ALTER TABLE sessionHistory ADD COLUMN updated_at TEXT').run();
      
      // 기존 레코드들에 현재 시간을 updated_at으로 설정
      const now = new Date().toISOString();
      db.prepare('UPDATE sessionHistory SET updated_at = ?').run(now);
      
      // 트랜잭션 커밋
      db.prepare('COMMIT').run();
      
      console.log('sessionHistory 테이블에 updated_at 컬럼이 성공적으로 추가되었습니다.');
    } catch (error) {
      // 에러 발생 시 롤백
      db.prepare('ROLLBACK').run();
      throw error;
    }
  }

} catch (error) {
  console.error('마이그레이션 중 오류 발생:', error);
} finally {
  db.close();
} 