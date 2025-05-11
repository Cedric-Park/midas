import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';

const PatchNotes = () => {
  const versions = [
    {
      version: 'v1.2.2',
      date: '2024-03-22',
      changes: [
        '✨ 회원 관리 기능 개선',
        '- 생년월일 입력 필드 연도 범위 제한 (1900년 ~ 현재 연도)',
        '- 회원 정보 수정 시 관리 횟수 연결 기능 안정화',
        '- 공유 중/의존 중 회원 표시 UI 개선',
        '- 회원 목록 정렬 기능 개선',
        '🐛 버그 수정',
        '- 회원 삭제 시 발생하던 오류 수정',
        '- 관리 횟수 공유 관련 데이터 처리 로직 개선',
        '- shared_with 필드 초기화 문제 해결',
      ],
    },
    {
      version: 'v1.2.1',
      date: '2024-03-22',
      changes: [
        '✨ 회원 관리 기능 개선',
        '- 생년월일 입력 필드 연도 범위 제한 (1900년 ~ 현재 연도)',
        '- 회원 정보 수정 시 관리 횟수 연결 기능 안정화',
        '- 공유 중/의존 중 회원 표시 UI 개선',
        '🐛 버그 수정',
        '- 회원 삭제 시 발생하던 오류 수정',
        '- 관리 횟수 공유 관련 데이터 처리 로직 개선',
      ],
    },
    {
      version: 'v1.2.0',
      date: '2024-03-21',
      changes: [
        '✨ 세션 완료 기능 개선',
        '- 세션 완료 시 공유 회원의 관리 내역에 관리 횟수 변경 정보 추가',
        '- 세션 내역에 예약된 시간 기록 방식 변경',
        '🐛 버그 수정',
        '- 예약 취소 시 발생하던 status 속성 관련 오류 수정',
        '- 세션 완료 후 공유 회원의 관리 횟수 실시간 갱신 문제 해결',
      ],
    },
    {
      version: 'v1.1.0',
      date: '2024-03-21',
      changes: [
        '✨ 관리 횟수 공유 기능 추가',
        '- 회원 간 관리 횟수 공유 기능 구현',
        '- 회원 정보 수정 모달에 관리 횟수 연결 필드 추가',
        '- 연결된 회원의 관리 횟수 자동 차감 기능 구현',
        '- 관리 내역에 연결된 회원의 사용 기록 추가',
      ],
    },
    {
      version: 'v1.0.1',
      date: '2024-03-21',
      changes: [
        '✨ 패치 노트 페이지 추가',
        '- 방문 랭킹 아이콘에 패치 노트 페이지 링크 연결',
        '- 버전별 변경사항 기록 기능 구현',
      ],
    },
    {
      version: 'v1.0.0',
      date: '2024-03-21',
      changes: [
        '회원 추가 모달 성능 개선',
        '- 모달 컴포넌트 분리 및 React.memo 적용',
        '- 입력 필드 최적화',
        '- 불필요한 리렌더링 제거',
      ],
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#3C1E1E', fontWeight: 700 }}>
        패치 노트
      </Typography>
      {versions.map(version => (
        <Paper
          key={version.version}
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: '#FFFBEA',
            border: '1px solid #e0cfc0',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#3C1E1E', fontWeight: 600 }}>
              {version.version}
            </Typography>
            <Typography variant="body2" sx={{ color: '#7B5E57' }}>
              {version.date}
            </Typography>
          </Box>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {version.changes.map((change, index) => (
              <Typography
                key={index}
                component="li"
                variant="body1"
                sx={{
                  color: '#3C1E1E',
                  mb: 0.5,
                  '&:last-child': { mb: 0 },
                }}
              >
                {change}
              </Typography>
            ))}
          </Box>
        </Paper>
      ))}
    </Container>
  );
};

export default PatchNotes;
