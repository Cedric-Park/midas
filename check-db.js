const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

console.log('=== 회원 수 ===');
const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get();
console.log(memberCount);

console.log('\n=== 회원 목록 ===');
const members = db.prepare('SELECT * FROM members').all();
console.log(members);

console.log('\n=== 예약 수 ===');
const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get();
console.log(appointmentCount);

console.log('\n=== 세션 내역 수 ===');
const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessionHistory').get();
console.log(sessionCount);

db.close(); 