@echo off
echo 서버 시작 중...

:: 백업 수행
node backup-db.js

:: 서버 시작
node server.js 