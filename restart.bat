@echo off
echo 서버 재시작을 시작합니다...

echo 1. 기존 Node.js 프로세스 종료
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo 기존 Node.js 프로세스가 없습니다.
) else (
    echo 기존 Node.js 프로세스를 종료했습니다.
)

echo 2. React 웹 서버 시작
start cmd /k "set PORT=3000 && npm start"

echo 3. json-server 시작
start cmd /k "set PORT=3001 && npm run server"

echo 서버 재시작이 완료되었습니다.
echo 웹 서버: http://localhost:3000
echo json-server: http://localhost:3001 