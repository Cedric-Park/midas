const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 연결
const db = new sqlite3.Database(path.join(__dirname, 'midas.db'), (err) => {
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
    db.run(`
      CREATE TABLE IF NOT EXISTS members_new (
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
        relationship TEXT,
        shared_with TEXT,
        depends_on TEXT
      )
    `, [], (err) => {
      if (err) {
        console.error('members 테이블 생성 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    // 1.2 기존 데이터 복사
    db.run(`
      INSERT OR IGNORE INTO members_new 
      SELECT 
        id, name, gender, birth_date, purpose, phone, 
        remaining_sessions, notes, join_date, last_visit, relationship,
        shared_with, depends_on
      FROM members
    `, [], (err) => {
      if (err) {
        console.error('members 데이터 복사 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    // 1.3 기존 테이블 삭제 및 새 테이블 이름 변경
    db.run('DROP TABLE IF EXISTS members', [], (err) => {
      if (err) {
        console.error('기존 members 테이블 삭제 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    db.run('ALTER TABLE members_new RENAME TO members', [], (err) => {
      if (err) {
        console.error('테이블 이름 변경 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    // 1.4 sessionHistory 테이블 구조 업데이트
    db.run(`
      CREATE TABLE IF NOT EXISTS sessionHistory_new (
        id TEXT PRIMARY KEY,
        memberId TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT NOT NULL,
        FOREIGN KEY (memberId) REFERENCES members(id)
      )
    `, [], (err) => {
      if (err) {
        console.error('sessionHistory 테이블 생성 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    // 1.5 기존 세션 내역 데이터 복사
    db.run(`
      INSERT OR IGNORE INTO sessionHistory_new 
      SELECT id, memberId, date, note
      FROM sessionHistory
    `, [], (err) => {
      if (err) {
        console.error('sessionHistory 데이터 복사 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    // 1.6 기존 테이블 삭제 및 새 테이블 이름 변경
    db.run('DROP TABLE IF EXISTS sessionHistory', [], (err) => {
      if (err) {
        console.error('기존 sessionHistory 테이블 삭제 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    db.run('ALTER TABLE sessionHistory_new RENAME TO sessionHistory', [], (err) => {
      if (err) {
        console.error('테이블 이름 변경 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
    });

    // 2. appointments 테이블에서 세션 완료된 예약 정보 가져오기
    db.all(`
      SELECT a.id, a.memberId, a.start, a.end, a.status
      FROM appointments a
      WHERE a.status = 'completed'
    `, [], (err, appointments) => {
      if (err) {
        console.error('예약 정보 조회 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }

      // 3. sessionHistory 테이블의 시간 업데이트
      const updateSessionHistory = (appointment) => {
        return new Promise((resolve, reject) => {
          // 3.1 세션 내역 시간 업데이트
          db.run(`
            UPDATE sessionHistory
            SET date = ?
            WHERE memberId = ? AND date >= ? AND date <= ?
          `, [
            appointment.start,
            appointment.memberId,
            appointment.start,
            appointment.end
          ], function(err) {
            if (err) {
              reject(err);
            } else {
              console.log(`회원 ID ${appointment.memberId}의 세션 내역 시간 업데이트 완료`);
              
              // 3.2 공유 회원의 세션 내역에 관리 횟수 변경 정보 추가
              db.all(`
                SELECT m.id, m.name, m.shared_with
                FROM members m
                WHERE m.shared_with LIKE ?
              `, [`%${appointment.memberId}%`], (err, sharedMembers) => {
                if (err) {
                  reject(err);
                  return;
                }

                const updateSharedMemberHistory = (sharedMember) => {
                  return new Promise((resolveShared, rejectShared) => {
                    db.run(`
                      INSERT INTO sessionHistory (memberId, date, note)
                      VALUES (?, ?, ?)
                    `, [
                      sharedMember.id,
                      appointment.start,
                      `${appointment.memberId}님이 관리 횟수 1을 사용하셨습니다.`
                    ], (err) => {
                      if (err) {
                        rejectShared(err);
                      } else {
                        console.log(`공유 회원 ID ${sharedMember.id}의 세션 내역 추가 완료`);
                        resolveShared();
                      }
                    });
                  });
                };

                Promise.all(sharedMembers.map(updateSharedMemberHistory))
                  .then(() => resolve())
                  .catch(reject);
              });
            }
          });
        });
      };

      // 4. 모든 예약에 대해 세션 내역 업데이트 실행
      Promise.all(appointments.map(updateSessionHistory))
        .then(() => {
          console.log('모든 세션 내역 업데이트 완료');
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('커밋 실패:', err);
              db.run('ROLLBACK');
              process.exit(1);
            }
            console.log('마이그레이션 완료');
            db.close();
          });
        })
        .catch((err) => {
          console.error('세션 내역 업데이트 실패:', err);
          db.run('ROLLBACK');
          db.close();
          process.exit(1);
        });
    });
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    db.run('ROLLBACK');
    db.close();
    process.exit(1);
  }
}); 