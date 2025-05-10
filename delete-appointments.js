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
    // 5월 10일 예약 삭제
    db.run(`
      DELETE FROM appointments 
      WHERE date(start) = '2024-05-10'
    `, [], function(err) {
      if (err) {
        console.error('5월 10일 예약 삭제 실패:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }
      console.log(`5월 10일 예약 ${this.changes}개가 삭제되었습니다.`);
      
      // 완료된 예약 삭제
      db.run(`
        DELETE FROM appointments 
        WHERE status = 'completed'
      `, [], function(err) {
        if (err) {
          console.error('완료된 예약 삭제 실패:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }
        console.log(`완료된 예약 ${this.changes}개가 삭제되었습니다.`);
        
        // 트랜잭션 커밋
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('커밋 실패:', err);
            db.run('ROLLBACK');
            process.exit(1);
          }
          console.log('예약 삭제 완료');
          db.close();
        });
      });
    });
  } catch (error) {
    console.error('예약 삭제 중 오류 발생:', error);
    db.run('ROLLBACK');
    db.close();
    process.exit(1);
  }
}); 