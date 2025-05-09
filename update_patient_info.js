const sqlite3 = require('better-sqlite3');
const fs = require('fs');

const db = new sqlite3('midas.db');

try {
  // db_info.json 파일 읽기
  const data = JSON.parse(fs.readFileSync('db_info.json', 'utf8'));
  
  // 업데이트 준비
  const updateStmt = db.prepare(`
    UPDATE patients 
    SET joinDate = ?,
        notes = ?,
        birthDate = ?
    WHERE id = ?
  `);

  // 트랜잭션 시작
  const updateMany = db.transaction((patients) => {
    let updateCount = 0;
    patients.forEach(patient => {
      const result = updateStmt.run(
        patient.joinDate || '',
        patient.notes || '',
        patient.birthDate || '',
        patient.id
      );
      updateCount += result.changes;
    });
    return updateCount;
  });

  // 업데이트 실행
  const updatedCount = updateMany(data.patients);
  console.log(`${updatedCount}명의 환자 정보가 업데이트되었습니다.`);

  // 업데이트 결과 확인
  const samplePatients = db.prepare(`
    SELECT id, name, birthDate, joinDate, notes 
    FROM patients 
    LIMIT 5
  `).all();

  console.log('\n업데이트된 환자 정보 샘플:');
  console.log(samplePatients);

} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
} 