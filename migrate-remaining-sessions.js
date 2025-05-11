const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 트랜잭션 시작
  db.prepare('BEGIN TRANSACTION').run();

  // 1. 외래 키 제약 조건 비활성화
  db.prepare('PRAGMA foreign_keys = OFF').run();

  // 2. 기존 테이블의 데이터 백업
  db.prepare(`CREATE TABLE members_backup AS SELECT * FROM members`).run();
  db.prepare(`CREATE TABLE appointments_backup AS SELECT * FROM appointments`).run();
  db.prepare(`CREATE TABLE treatmentHistory_backup AS SELECT * FROM treatmentHistory`).run();

  // 3. 기존 테이블 삭제
  db.prepare('DROP TABLE IF EXISTS members').run();
  db.prepare('DROP TABLE IF EXISTS appointments').run();
  db.prepare('DROP TABLE IF EXISTS treatmentHistory').run();

  // 4. 새로운 테이블 생성
  db.prepare(
    `
    CREATE TABLE members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      purpose TEXT NOT NULL,
      phone TEXT NOT NULL,
      remaining_sessions INTEGER DEFAULT 0,
      notes TEXT,
      join_date TEXT NOT NULL,
      last_visit TEXT,
      relationship TEXT
    )
  `
  ).run();

  db.prepare(
    `
    CREATE TABLE appointments (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id)
    )
  `
  ).run();

  db.prepare(
    `
    CREATE TABLE treatmentHistory (
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
    INSERT INTO members 
    SELECT 
      id, name, gender, birth_date, purpose, phone, 
      remaining_treatments as remaining_sessions, 
      notes, join_date, last_visit, relationship
    FROM members_backup
  `
  ).run();

  db.prepare(
    `
    INSERT INTO appointments 
    SELECT * FROM appointments_backup
  `
  ).run();

  db.prepare(
    `
    INSERT INTO treatmentHistory 
    SELECT * FROM treatmentHistory_backup
  `
  ).run();

  // 6. 백업 테이블 삭제
  db.prepare('DROP TABLE members_backup').run();
  db.prepare('DROP TABLE appointments_backup').run();
  db.prepare('DROP TABLE treatmentHistory_backup').run();

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
