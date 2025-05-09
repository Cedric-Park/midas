const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

try {
  // 모든 테이블 목록 조회
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all();

  console.log('테이블 목록:');
  for (const table of tables) {
    console.log(`\n테이블: ${table.name}`);
    
    // 각 테이블의 스키마 조회
    const schema = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(table.name);
    
    console.log(schema.sql);

    // 외래 키 제약 조건 조회
    const foreignKeys = db.prepare(`
      SELECT * FROM pragma_foreign_key_list(?)
    `).all(table.name);

    if (foreignKeys.length > 0) {
      console.log('\n외래 키 제약 조건:');
      console.log(foreignKeys);
    }
  }
} catch (error) {
  console.error('스키마 조회 중 오류 발생:', error);
} finally {
  db.close();
} 