const fs = require('fs');
const sqlite3 = require('better-sqlite3');

// db.json 파일 읽기
const data = JSON.parse(fs.readFileSync('db.json', 'utf8'));

// SQLite 데이터베이스 연결
const db = new sqlite3('midas.db');

// 트랜잭션 시작
const migration = db.transaction(() => {
  // 기존 데이터 삭제
  db.prepare('DELETE FROM patients').run();
  db.prepare('DELETE FROM appointments').run();
  db.prepare('DELETE FROM treatmentHistory').run();

  // 환자 데이터 마이그레이션
  const insertPatient = db.prepare(`
    INSERT INTO patients (
      id, name, gender, birthDate, purpose, phone, 
      remainCount, relationship, joinDate, lastVisit
    ) VALUES (
      @id, @name, @gender, @birthDate, @purpose, @phone,
      @remainCount, @relationship, @joinDate, @lastVisit
    )
  `);

  // 예약 데이터 마이그레이션
  const insertAppointment = db.prepare(`
    INSERT INTO appointments (
      id, patientId, start, end, status
    ) VALUES (
      @id, @patientId, @start, @end, @status
    )
  `);

  // 진료 내역 데이터 마이그레이션
  const insertTreatmentHistory = db.prepare(`
    INSERT INTO treatmentHistory (
      id, patientId, date, note
    ) VALUES (
      @id, @patientId, @date, @note
    )
  `);

  // 환자 데이터 삽입
  console.log('환자 데이터 마이그레이션 중...');
  for (const patient of data.patients || []) {
    try {
      insertPatient.run({
        id: patient.id || '',
        name: patient.name || '',
        gender: patient.gender || '',
        birthDate: patient.birthDate || '',
        purpose: patient.purpose || '',
        phone: patient.phone || '',
        remainCount: patient.remainCount || 0,
        relationship: patient.relationship || '',
        joinDate: patient.joinDate || '',
        lastVisit: patient.lastVisit || '',
      });
    } catch (error) {
      console.error(`환자 데이터 마이그레이션 실패 (ID: ${patient.id}):`, error);
    }
  }

  // 예약 데이터 삽입
  console.log('예약 데이터 마이그레이션 중...');
  for (const appointment of data.appointments || []) {
    try {
      insertAppointment.run({
        id: appointment.id || '',
        patientId: appointment.patientId || '',
        start: appointment.start || '',
        end: appointment.end || '',
        status: appointment.status || 'scheduled',
      });
    } catch (error) {
      console.error(`예약 데이터 마이그레이션 실패 (ID: ${appointment.id}):`, error);
    }
  }

  // 진료 내역 데이터 삽입
  console.log('진료 내역 마이그레이션 중...');
  for (const history of data.treatmentHistory || []) {
    try {
      insertTreatmentHistory.run({
        id: history.id || '',
        patientId: history.patientId || '',
        date: history.date || '',
        note: history.note || '',
      });
    } catch (error) {
      console.error(`진료 내역 마이그레이션 실패 (ID: ${history.id}):`, error);
    }
  }
});

try {
  // 트랜잭션 실행
  migration();
  console.log('데이터 마이그레이션이 완료되었습니다.');

  // 데이터 확인
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
  const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
  const historyCount = db.prepare('SELECT COUNT(*) as count FROM treatmentHistory').get().count;

  console.log(`
마이그레이션된 데이터 수:
- 환자: ${patientCount}명
- 예약: ${appointmentCount}건
- 진료 내역: ${historyCount}건
  `);
} catch (error) {
  console.error('마이그레이션 실패:', error);
} finally {
  // 데이터베이스 연결 종료
  db.close();
}
