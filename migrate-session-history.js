const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 트랜잭션 시작
  db.prepare('BEGIN TRANSACTION').run();

  // 1. 외래 키 제약 조건 비활성화
  db.prepare('PRAGMA foreign_keys = OFF').run();

  // 2. 기존 테이블의 데이터 백업
  db.prepare(`CREATE TABLE sessionHistory_backup AS SELECT * FROM treatmentHistory`).run();

  // 3. 기존 테이블 삭제
  db.prepare('DROP TABLE IF EXISTS treatmentHistory').run();

  // 4. 새로운 테이블 생성
  db.prepare(
    `
    CREATE TABLE sessionHistory (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id)
    )
  `
  ).run();

  // 5. 데이터 복원
  db.prepare(
    `
    INSERT INTO sessionHistory 
    SELECT * FROM sessionHistory_backup
  `
  ).run();

  // 6. 백업 테이블 삭제
  db.prepare('DROP TABLE sessionHistory_backup').run();

  // 7. 외래 키 제약 조건 다시 활성화
  db.prepare('PRAGMA foreign_keys = ON').run();

  // 트랜잭션 커밋
  db.prepare('COMMIT').run();

  console.log('데이터베이스 마이그레이션이 성공적으로 완료되었습니다.');
} catch (error) {
  // 에러 발생 시 롤백
  db.prepare('ROLLBACK').run();
  console.error('데이터베이스 마이그레이션 중 오류 발생:', error);
} finally {
  db.close();
}
