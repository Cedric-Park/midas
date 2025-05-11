const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 연결
const db = new sqlite3.Database(path.join(__dirname, 'midas.db'), err => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err);
    process.exit(1);
  }
  console.log('데이터베이스 연결 성공');
});

// 트랜잭션 시작
db.serialize(() => {
  db.run('BEGIN TRANSACTION');

  try {
    // 1. 데이터베이스 구조 업데이트
    // 1.1 members 테이블 구조 업데이트
    db.run(
      `
      ALTER TABLE members ADD COLUMN join_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d', 'now'))
    `,
      [],
      err => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('members 테이블 join_date 컬럼 추가 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
      }
    );

    // 1.2 members 테이블에 depends_on 컬럼 추가
    db.run(
      `
      ALTER TABLE members ADD COLUMN depends_on TEXT
    `,
      [],
      err => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('members 테이블 depends_on 컬럼 추가 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
      }
    );

    // 1.3 members 테이블에 shared_with 컬럼 추가
    db.run(
      `
      ALTER TABLE members ADD COLUMN shared_with TEXT DEFAULT '[]'
    `,
      [],
      err => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('members 테이블 shared_with 컬럼 추가 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
      }
    );

    // 1.4 treatmentHistory 테이블을 sessionHistory로 변경
    db.run(
      `
      CREATE TABLE IF NOT EXISTS sessionHistory (
        id TEXT PRIMARY KEY,
        memberId TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY (memberId) REFERENCES members(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `,
      [],
      err => {
        if (err) {
          console.error('sessionHistory 테이블 생성 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
      }
    );

    // treatmentHistory 테이블이 존재하면 데이터 복사
    db.run(
      `
      INSERT OR IGNORE INTO sessionHistory 
      SELECT * FROM treatmentHistory
    `,
      [],
      err => {
        if (err && !err.message.includes('no such table')) {
          console.error('treatmentHistory 데이터 복사 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
      }
    );

    // treatmentHistory 테이블 삭제
    db.run('DROP TABLE IF EXISTS treatmentHistory', [], err => {
      if (err) {
        console.error('treatmentHistory 테이블 삭제 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    // 1.5 appointments 테이블 구조 업데이트
    db.run(
      `
      ALTER TABLE appointments ADD COLUMN status TEXT NOT NULL DEFAULT 'scheduled'
    `,
      [],
      err => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('appointments 테이블 status 컬럼 추가 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
      }
    );

    // 1.6 appointments 테이블의 외래 키 제약 조건 업데이트
    db.run(
      `
      CREATE TABLE IF NOT EXISTS appointments_new (
        id TEXT PRIMARY KEY,
        memberId TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        FOREIGN KEY (memberId) REFERENCES members(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `,
      [],
      err => {
        if (err) {
          console.error('appointments_new 테이블 생성 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
      }
    );

    // 기존 데이터 복사
    db.run(
      `
      INSERT OR IGNORE INTO appointments_new 
      SELECT * FROM appointments
    `,
      [],
      err => {
        if (err) {
          console.error('appointments 데이터 복사 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
      }
    );

    // 기존 테이블 삭제 및 새 테이블 이름 변경
    db.run('DROP TABLE IF EXISTS appointments', [], err => {
      if (err) {
        console.error('기존 appointments 테이블 삭제 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    db.run('ALTER TABLE appointments_new RENAME TO appointments', [], err => {
      if (err) {
        console.error('appointments 테이블 이름 변경 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    // 트랜잭션 커밋
    db.run('COMMIT', err => {
      if (err) {
        console.error('커밋 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
      console.log('마이그레이션 완료');
      db.close();
    });
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    db.run('ROLLBACK');
    db.close();
    process.exit(1);
  }
});
