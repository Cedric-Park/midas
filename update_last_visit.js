const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 환자의 마지막 방문일 업데이트
  const updateStmt = db.prepare(`
    UPDATE patients 
    SET lastVisit = (
      SELECT MAX(start) 
      FROM appointments 
      WHERE patientId = patients.id 
      AND status = 'completed'
    )
  `);

  const result = updateStmt.run();
  console.log(`${result.changes}명의 환자 마지막 방문일이 업데이트되었습니다.`);

  // 업데이트 결과 확인
  const patients = db
    .prepare(
      `
    SELECT id, name, lastVisit 
    FROM patients 
    WHERE lastVisit != ''
    LIMIT 5
  `
    )
    .all();

  console.log('\n마지막 방문일이 업데이트된 환자 샘플:');
  console.log(patients);
} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
}
