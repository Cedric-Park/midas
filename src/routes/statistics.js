const express = require('express');
const router = express.Router();

// 임시: Not Implemented
router.get('/', (req, res) => {
  res.status(501).json({ message: '통계 API는 아직 구현되지 않았습니다.' });
});

router.get('/daily', (req, res) => {
  res.status(501).json({ message: '통계 API는 아직 구현되지 않았습니다.' });
});

router.get('/monthly', (req, res) => {
  res.status(501).json({ message: '통계 API는 아직 구현되지 않았습니다.' });
});

router.get('/yearly', (req, res) => {
  res.status(501).json({ message: '통계 API는 아직 구현되지 않았습니다.' });
});

module.exports = router; 