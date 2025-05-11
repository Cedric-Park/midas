const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 백업 디렉토리 생성
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// 현재 날짜로 백업 파일명 생성
const date = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `midas-${date}.db`);

// 데이터베이스 파일 복사
fs.copyFileSync('midas.db', backupFile);
console.log(`백업 완료: ${backupFile}`);
