const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 트랜잭션 시작
  db.prepare('BEGIN TRANSACTION').run();

  // 1. 새로운 members 테이블 생성
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      purpose TEXT NOT NULL,
      phone TEXT NOT NULL,
      remaining_treatments INTEGER DEFAULT 0,
      notes TEXT,
      join_date TEXT NOT NULL,
      last_visit TEXT,
      relationship TEXT
    )
  `
  ).run();

  // 2. 기존 patients 테이블의 데이터를 members 테이블로 복사
  db.prepare(
    `
    INSERT INTO members 
    SELECT * FROM patients
  `
  ).run();

  // 3. appointments 테이블의 patientId를 memberId로 변경
  db.prepare(
    `
    CREATE TABLE appointments_new (
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
    INSERT INTO appointments_new 
    SELECT id, patientId as memberId, start, end, status 
    FROM appointments
  `
  ).run();

  // 4. treatmentHistory 테이블의 patientId를 memberId로 변경
  db.prepare(
    `
    CREATE TABLE treatmentHistory_new (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id)
    )
  `
  ).run();

  db.prepare(
    `
    INSERT INTO treatmentHistory_new 
    SELECT id, patientId as memberId, date, note 
    FROM treatmentHistory
  `
  ).run();

  // 5. 기존 테이블 삭제
  db.prepare('DROP TABLE IF EXISTS patients').run();
  db.prepare('DROP TABLE IF EXISTS appointments').run();
  db.prepare('DROP TABLE IF EXISTS treatmentHistory').run();

  // 6. 새 테이블 이름 변경
  db.prepare('ALTER TABLE appointments_new RENAME TO appointments').run();
  db.prepare('ALTER TABLE treatmentHistory_new RENAME TO treatmentHistory').run();

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
