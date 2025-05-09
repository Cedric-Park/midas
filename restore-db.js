const fs = require('fs');
const sqlite3 = require('better-sqlite3');

// db.json 파일 읽기
const data = JSON.parse(fs.readFileSync('db.json', 'utf8'));

// 데이터베이스 연결
const db = new sqlite3('midas.db');

try {
  // 트랜잭션 시작
  db.prepare('BEGIN TRANSACTION').run();

  // members 테이블 데이터 복원
  if (data.members && Array.isArray(data.members)) {
    const insertMember = db.prepare(`
      INSERT INTO members (
        id, name, gender, birth_date, phone, join_date, 
        last_visit, remaining_sessions, purpose, relationship, notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    for (const member of data.members) {
      try {
        insertMember.run(
          member.id || Date.now().toString(),
          member.name || '',
          member.gender || '',
          member.birth_date || '',
          member.phone || '',
          member.join_date || new Date().toISOString(),
          member.last_visit || null,
          member.remaining_sessions || 0,
          member.purpose || '',
          member.relationship || '',
          member.notes || ''
        );
      } catch (error) {
        console.error('회원 데이터 복원 중 오류:', member, error);
      }
    }
    console.log(`${data.members.length}명의 회원 데이터가 복원되었습니다.`);
  }

  // appointments 테이블 데이터 복원
  if (data.appointments && Array.isArray(data.appointments)) {
    const insertAppointment = db.prepare(`
      INSERT INTO appointments (id, memberId, start, end, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const appointment of data.appointments) {
      if (appointment.memberId) {  // memberId가 있는 경우만 처리
        try {
          insertAppointment.run(
            appointment.id || Date.now().toString(),
            appointment.memberId,
            appointment.start || new Date().toISOString(),
            appointment.end || new Date().toISOString(),
            appointment.status || 'scheduled'
          );
        } catch (error) {
          console.error('예약 데이터 복원 중 오류:', appointment, error);
        }
      }
    }
    console.log(`${data.appointments.length}개의 예약 데이터가 복원되었습니다.`);
  }

  // sessionHistory 테이블 데이터 복원
  if (data.sessionHistory && Array.isArray(data.sessionHistory)) {
    const insertSession = db.prepare(`
      INSERT INTO sessionHistory (id, memberId, date, note)
      VALUES (?, ?, ?, ?)
    `);

    for (const session of data.sessionHistory) {
      if (session.memberId) {  // memberId가 있는 경우만 처리
        try {
          insertSession.run(
            session.id || Date.now().toString(),
            session.memberId,
            session.date || new Date().toISOString(),
            session.note || ''
          );
        } catch (error) {
          console.error('세션 내역 복원 중 오류:', session, error);
        }
      }
    }
    console.log(`${data.sessionHistory.length}개의 세션 내역이 복원되었습니다.`);
  }

  // 트랜잭션 커밋
  db.prepare('COMMIT').run();
  console.log('데이터 복원이 완료되었습니다.');

} catch (error) {
  // 에러 발생 시 롤백
  db.prepare('ROLLBACK').run();
  console.error('데이터 복원 중 오류 발생:', error);
} finally {
  db.close();
} 