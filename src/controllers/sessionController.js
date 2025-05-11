const db = require('../db/knex');
const { AppError } = require('../middleware/errorHandler');

exports.createSession = async (req, res, next) => {
  try {
    const { memberId, date, startTime, endTime, type, memo } = req.body;

    if (!memberId || !date || !startTime || !endTime || !type) {
      throw new AppError('필수 입력 항목이 누락되었습니다.', 400);
    }

    const member = await db('members').where({ id: memberId }).first();
    if (!member) {
      throw new AppError('회원을 찾을 수 없습니다.', 404);
    }

    const [session] = await db('sessionHistory').insert({
      member_id: memberId,
      date,
      start_time: startTime,
      end_time: endTime,
      type,
      memo,
      created_at: db.fn.now()
    }).returning('*');

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    const { memberId } = req.query;
    let query = db('sessionHistory')
      .select('sessionHistory.*', 'members.name as member_name')
      .leftJoin('members', 'sessionHistory.member_id', 'members.id');

    if (memberId) {
      query = query.where('sessionHistory.member_id', memberId);
    }

    const sessions = await query.orderBy('sessionHistory.date', 'desc');
    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
};

exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await db('sessionHistory')
      .select('sessionHistory.*', 'members.name as member_name')
      .leftJoin('members', 'sessionHistory.member_id', 'members.id')
      .where('sessionHistory.id', id)
      .first();

    if (!session) {
      throw new AppError('세션을 찾을 수 없습니다.', 404);
    }

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, type, memo } = req.body;

    const session = await db('sessionHistory').where({ id }).first();
    if (!session) {
      throw new AppError('세션을 찾을 수 없습니다.', 404);
    }

    const [updatedSession] = await db('sessionHistory')
      .where({ id })
      .update({
        date,
        start_time: startTime,
        end_time: endTime,
        type,
        memo,
        updated_at: db.fn.now()
      })
      .returning('*');

    res.status(200).json(updatedSession);
  } catch (error) {
    next(error);
  }
};

exports.deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await db('sessionHistory').where({ id }).first();

    if (!session) {
      throw new AppError('세션을 찾을 수 없습니다.', 404);
    }

    await db('sessionHistory').where({ id }).delete();
    res.status(200).json({ message: '세션이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}; 