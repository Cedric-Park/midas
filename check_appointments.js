const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 예약 정보와 환자 정보 함께 조회
  const appointments = db
    .prepare(
      `
    SELECT 
      a.*,
      p.name as patientName,
      p.gender,
      p.birthDate,
      p.purpose,
      p.phone,
      p.remainCount,
      p.relationship,
      p.joinDate,
      p.lastVisit,
      p.notes
    FROM appointments a
    JOIN patients p ON a.patientId = p.id
    ORDER BY a.start DESC
    LIMIT 10
  `
    )
    .all();

  console.log('최근 예약 정보:');
  console.log(appointments);
} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
}
