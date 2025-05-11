const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 먼저 해당 레코드 확인
  const records = db
    .prepare(
      `
    SELECT th.*, p.name 
    FROM treatmentHistory th 
    JOIN patients p ON th.patientId = p.id 
    WHERE p.name IN ('강송녀', '강선희') 
    AND date LIKE '2024-05-02%'
  `
    )
    .all();

  console.log('삭제할 레코드:', records);

  // 레코드 삭제
  const deleteStmt = db.prepare(`
    DELETE FROM treatmentHistory 
    WHERE patientId IN (
      SELECT id FROM patients WHERE name IN ('강송녀', '강선희')
    ) 
    AND date LIKE '2024-05-02%'
  `);

  const result = deleteStmt.run();
  console.log(`${result.changes}개의 레코드가 삭제되었습니다.`);
} catch (error) {
  console.error('에러 발생:', error);
} finally {
  db.close();
}
