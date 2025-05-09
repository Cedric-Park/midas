const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

// 테이블 목록 조회
console.log('테이블 목록:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

// 각 테이블의 데이터 조회
tables.forEach(table => {
  console.log(`\n${table.name} 테이블 데이터:`);
  const data = db.prepare(`SELECT * FROM ${table.name}`).all();
  console.log(data);
});

db.close(); 