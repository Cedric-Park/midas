const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 트랜잭션 시작
  db.prepare('BEGIN TRANSACTION').run();

  // 모든 회원 조회
  const members = db.prepare('SELECT id, name, depends_on FROM members').all();

  // 각 회원의 depends_on 필드 업데이트
  const updateMember = db.prepare('UPDATE members SET depends_on = ? WHERE id = ?');

  for (const member of members) {
    if (member.depends_on) {
      try {
        // JSON 배열인 경우 첫 번째 항목만 사용
        const dependsOnArray = JSON.parse(member.depends_on);
        if (Array.isArray(dependsOnArray) && dependsOnArray.length > 0) {
          updateMember.run(dependsOnArray[0], member.id);
          console.log(`회원 ${member.name}의 depends_on이 업데이트되었습니다: ${dependsOnArray[0]}`);
        }
      } catch (error) {
        // 이미 문자열인 경우 그대로 유지
        console.log(`회원 ${member.name}의 depends_on은 이미 문자열입니다: ${member.depends_on}`);
      }
    }
  }

  // 트랜잭션 커밋
  db.prepare('COMMIT').run();
  console.log('모든 회원의 depends_on 필드가 성공적으로 업데이트되었습니다.');
} catch (error) {
  // 에러 발생 시 롤백
  db.prepare('ROLLBACK').run();
  console.error('마이그레이션 중 오류 발생:', error);
} finally {
  db.close();
} 