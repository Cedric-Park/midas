# Midas - 회원 관리 시스템

회원 관리, 예약 관리, 세션 기록을 위한 웹 기반 관리 시스템입니다.

## 주요 기능

- 회원 관리
  - 회원 등록/수정/삭제
  - 회원 정보 조회
  - 관리 횟수 관리
  - 회원 간 관리 횟수 공유

- 예약 관리
  - 예약 생성/수정/삭제
  - 예약 상태 관리 (예약/완료/취소)
  - 캘린더 뷰

- 세션 관리
  - 세션 기록 추가/수정/삭제
  - 세션 내역 조회
  - 관리 횟수 자동 차감

## 설치 방법

1. 저장소 클론
```bash
git clone [repository-url]
cd midas
```

2. 의존성 설치
```bash
npm install
```

3. 환경 설정
- `.env.example` 파일을 `.env`로 복사
- 필요한 환경 변수 설정

4. 데이터베이스 초기화
```bash
node init-db.js
```

## 실행 방법

1. 개발 서버 실행
```bash
npm start
```

2. 프로덕션 서버 실행
```bash
npm run start:prod
```

## 데이터베이스 구조

### members 테이블
- id: TEXT (PK)
- name: TEXT
- gender: TEXT
- birth_date: TEXT
- phone: TEXT
- join_date: TEXT
- last_visit: TEXT
- remaining_sessions: INTEGER
- purpose: TEXT
- relationship: TEXT
- notes: TEXT
- shared_with: TEXT
- depends_on: TEXT

### appointments 테이블
- id: TEXT (PK)
- memberId: TEXT (FK)
- start: TEXT
- end: TEXT
- status: TEXT

### sessionHistory 테이블
- id: TEXT (PK)
- memberId: TEXT (FK)
- date: TEXT
- note: TEXT

## 환경 변수

- `DB_PATH`: 데이터베이스 파일 경로
- `PORT`: 서버 포트
- `CORS_ORIGIN`: CORS 설정
- `SESSION_SECRET`: 세션 시크릿 키
- `JWT_SECRET`: JWT 시크릿 키

## 업데이트 방법

1. 코드 업데이트
```bash
./update-code.bat
```

2. 데이터베이스 백업
```bash
node backup-db.js
```

## 라이선스

MIT License 