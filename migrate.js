const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('midas.db');
const fs = require('fs');

// db_info.json 파일 읽기
const dbInfo = JSON.parse(fs.readFileSync('db_info.json', 'utf8'));

// treatmentHistory 테이블 생성
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS treatmentHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
  )`);

  // treatmentHistory 데이터 마이그레이션
  if (dbInfo.treatmentHistory && Array.isArray(dbInfo.treatmentHistory)) {
    const stmt = db.prepare('INSERT INTO treatmentHistory (patientId, date, note) VALUES (?, ?, ?)');
    
    dbInfo.treatmentHistory.forEach(history => {
      stmt.run(
        history.patientId,
        history.date,
        history.note
      );
    });
    
    stmt.finalize();
    console.log('treatmentHistory 데이터 마이그레이션 완료');
  } else {
    console.log('treatmentHistory 데이터가 없습니다.');
  }
});

db.close(); 