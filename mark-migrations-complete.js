const db = require('better-sqlite3')('midas.db');

const migrations = [
  '20250510120203_create_members_table.js',
  '20250510120214_create_session_history_table.js',
];

// knex_migrations 테이블이 없으면 생성

db.prepare(`CREATE TABLE IF NOT EXISTS knex_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  batch INTEGER,
  migration_time DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

// 이미 등록된 마이그레이션 이름 조회
const existing = db.prepare('SELECT name FROM knex_migrations').all().map(r => r.name);

let batch = 1;
const lastBatch = db.prepare('SELECT MAX(batch) as maxBatch FROM knex_migrations').get();
if (lastBatch && lastBatch.maxBatch) batch = lastBatch.maxBatch + 1;

for (const name of migrations) {
  if (!existing.includes(name)) {
    db.prepare('INSERT INTO knex_migrations (name, batch) VALUES (?, ?)').run(name, batch);
    console.log(`${name} 마이그레이션 완료로 표시됨.`);
  }
}

console.log('모든 마이그레이션 완료로 표시됨.'); 