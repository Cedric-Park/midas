const knex = require('../config/database');
const AppError = require('../utils/appError');

const createAppointment = async (appointmentData) => {
  try {
    const { memberId, date, time, type, note } = appointmentData;

    if (!memberId || !date || !time) {
      throw new AppError('필수 필드가 누락되었습니다.', 400);
    }

    // 회원 존재 여부 확인
    const member = await knex('members').where('id', memberId).first();
    if (!member) {
      throw new AppError('존재하지 않는 회원입니다.', 400);
    }

    // 중복 예약 확인
    const existingAppointment = await knex('appointments')
      .where({
        memberId,
        date,
        time
      })
      .first();

    if (existingAppointment) {
      throw new AppError('이미 해당 시간에 예약이 있습니다.', 400);
    }

    const [appointment] = await knex('appointments')
      .insert({
        memberId,
        date,
        time,
        type: type || '일반',
        note: note || '',
        status: 'scheduled'
      })
      .returning('*');

    return appointment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('예약 생성에 실패했습니다.', 500);
  }
};

const getAppointments = async (filters = {}) => {
  try {
    let query = knex('appointments').select('*');

    if (filters.memberId) {
      query = query.where('memberId', filters.memberId);
    }
    if (filters.date) {
      query = query.where('date', filters.date);
    }

    return await query;
  } catch (error) {
    throw new AppError('예약 조회에 실패했습니다.', 500);
  }
};

const getAppointmentById = async (id) => {
  try {
    const appointment = await knex('appointments').where('id', id).first();
    if (!appointment) {
      throw new AppError('예약을 찾을 수 없습니다.', 404);
    }
    return appointment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('예약 조회에 실패했습니다.', 500);
  }
};

const updateAppointment = async (id, updateData) => {
  try {
    const appointment = await knex('appointments').where('id', id).first();
    if (!appointment) {
      throw new AppError('예약을 찾을 수 없습니다.', 404);
    }

    const [updatedAppointment] = await knex('appointments')
      .where('id', id)
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');

    return updatedAppointment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('예약 수정에 실패했습니다.', 500);
  }
};

const deleteAppointment = async (id) => {
  try {
    const appointment = await knex('appointments').where('id', id).first();
    if (!appointment) {
      throw new AppError('예약을 찾을 수 없습니다.', 404);
    }

    await knex('appointments').where('id', id).del();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('예약 삭제에 실패했습니다.', 500);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
}; 