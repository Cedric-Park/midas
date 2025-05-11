const knex = require('../config/database');
const AppError = require('../utils/appError');

const createAppointment = async (req, res, next) => {
  try {
    const { memberId, start, end, status } = req.body;

    if (!memberId || !start || !end) {
      throw new AppError('필수 필드가 누락되었습니다.', 400);
    }

    // 회원 존재 여부 확인
    const member = await knex('members').where('id', memberId).first();
    if (!member) {
      throw new AppError('존재하지 않는 회원입니다.', 400);
    }

    const [appointment] = await knex('appointments')
      .insert({
        memberId,
        start,
        end,
        status: status || 'scheduled'
      })
      .returning('*');

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const { memberId, date } = req.query;
    let query = knex('appointments').select('*');

    if (memberId) {
      query = query.where('memberId', memberId);
    }
    if (date) {
      query = query.where('date', date);
    }

    const appointments = await query;
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await knex('appointments').where('id', id).first();

    if (!appointment) {
      throw new AppError('예약을 찾을 수 없습니다.', 404);
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const appointment = await knex('appointments').where('id', id).first();
    if (!appointment) {
      throw new AppError('예약을 찾을 수 없습니다.', 404);
    }

    const [updatedAppointment] = await knex('appointments')
      .where('id', id)
      .update({
        status: status || appointment.status,
        note: note || appointment.note,
        updated_at: new Date()
      })
      .returning('*');

    res.json(updatedAppointment);
  } catch (error) {
    next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await knex('appointments').where('id', id).first();

    if (!appointment) {
      throw new AppError('예약을 찾을 수 없습니다.', 404);
    }

    await knex('appointments').where('id', id).del();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
}; 