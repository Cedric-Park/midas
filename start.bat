@echo off
echo MIDAS 서버 시작...

rem db.json 백업
if exist db.json (
    copy db.json db.json.bak /Y
    echo db.json 백업 생성 완료
)

if not exist db.json (
    if exist db.json.bak (
        copy db.json.bak db.json /Y
        echo db.json 복원 완료
    ) else (
        echo db.json 파일이 없습니다. 기본 데이터로 생성합니다...
        echo {> db.json
        echo   "patients": [>> db.json
        echo     {>> db.json
        echo       "id": "1",>> db.json
        echo       "name": "김민수",>> db.json
        echo       "gender": "남",>> db.json
        echo       "birthDate": "1990-01-15",>> db.json
        echo       "purpose": "다이어트",>> db.json
        echo       "phone": "010-1234-5678",>> db.json
        echo       "joinDate": "2024-01-01",>> db.json
        echo       "lastVisit": "2024-01-08",>> db.json
        echo       "remainCount": 10,>> db.json
        echo       "relationship": "소개: 박준호">> db.json
        echo     }>> db.json
        echo   ],>> db.json
        echo   "appointments": [>> db.json
        echo     {>> db.json
        echo       "id": "1",>> db.json
        echo       "patientId": "1",>> db.json
        echo       "start": "2024-01-08T10:00:00",>> db.json
        echo       "end": "2024-01-08T11:00:00",>> db.json
        echo       "status": "completed">> db.json
        echo     }>> db.json
        echo   ],>> db.json
        echo   "treatmentHistory": [>> db.json
        echo     {>> db.json
        echo       "id": "1",>> db.json
        echo       "patientId": "1",>> db.json
        echo       "appointmentId": "1",>> db.json
        echo       "date": "2024-01-08",>> db.json
        echo       "note": "초기 상담 및 진찰 완료. 체중: 75kg, 체지방률: 28%%">> db.json
        echo     }>> db.json
        echo   ]>> db.json
        echo }>> db.json
        echo db.json 파일이 생성되었습니다.
    )
    echo.
)

start cmd /k "npm run server"
timeout /t 2
start cmd /k "npm start"

echo.
echo React 앱(3000번 포트)과 json-server(3001번 포트)가 시작되었습니다.
echo 종료하려면 각 창의 X 버튼을 클릭하세요. 