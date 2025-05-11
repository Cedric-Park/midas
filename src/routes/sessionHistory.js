const express = require('express');
const router = express.Router();
const knex = require('../config/database');
const AppError = require('../utils/appError');

// 세션 내역 조회
router.get('/', async (req, res, next) => {
  try {
    const { memberId, startDate } = req.query;
    let query = knex('sessionHistory').select('*');

    if (memberId) {
      query = query.where('memberId', memberId);
    }
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }

    const history = await query.orderBy('date', 'desc');
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// 세션 내역 생성
router.post('/', async (req, res, next) => {
  try {
    const { memberId, date, note } = req.body;

    if (!memberId || !date || !note) {
      throw new AppError('필수 필드가 누락되었습니다.', 400);
    }

    const [sessionHistory] = await knex('sessionHistory')
      .insert({
        memberId,
        date,
        note
      })
      .returning('*');

    res.status(201).json(sessionHistory);
  } catch (error) {
    next(error);
  }
});

// 세션 내역 수정
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, note } = req.body;

    const [updatedHistory] = await knex('sessionHistory')
      .where('id', id)
      .update({
        date,
        note,
        updated_at: new Date()
      })
      .returning('*');

    if (!updatedHistory) {
      throw new AppError('존재하지 않는 세션 내역입니다.', 404);
    }

    res.json(updatedHistory);
  } catch (error) {
    next(error);
  }
});

// 세션 내역 삭제
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await knex('sessionHistory').where('id', id).del();

    if (!deleted) {
      throw new AppError('존재하지 않는 세션 내역입니다.', 404);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router; 