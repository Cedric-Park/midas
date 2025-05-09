import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';

const PatchNotes = () => {
  const versions = [
    {
      version: 'v1.0.0',
      date: '2024-03-21',
      changes: [
        '회원 추가 모달 성능 개선',
        '- 모달 컴포넌트 분리 및 React.memo 적용',
        '- 입력 필드 최적화',
        '- 불필요한 리렌더링 제거'
      ]
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#3C1E1E', fontWeight: 700 }}>
        패치 노트
      </Typography>
      {versions.map((version) => (
        <Paper 
          key={version.version}
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 3, 
            backgroundColor: '#FFFBEA',
            border: '1px solid #e0cfc0',
            borderRadius: 2
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
                  '&:last-child': { mb: 0 }
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