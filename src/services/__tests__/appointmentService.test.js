const appointmentService = require('../appointmentService');
const db = require('../../db/knex');
const { AppError } = require('../../middleware/errorHandler');

beforeEach(async () => {
  await db('appointments').del();
  await db('members').del();
});

afterAll(async () => {
  await db.destroy();
});

describe('appointmentService', () => {
  let memberId;
  beforeEach(async () => {
    // 테스트용 회원 생성
    const [id] = await db('members').insert({
      id: 'MEM001',
      name: '테스트회원',
      gender: 'F',
      birth_date: '2000-01-01',
      purpose: '테스트',
      phone: '010-0000-0000',
      join_date: '2024-01-01'
    });
    memberId = 'MEM001';
  });

  it('예약을 생성하고 조회할 수 있어야 한다', async () => {
    const data = {
      memberId,
      start: '2024-05-10T10:00:00.000Z',
      end: '2024-05-10T11:00:00.000Z',
      status: 'scheduled'
    };
    const appointment = await appointmentService.createAppointment(data);
    expect(appointment).toHaveProperty('id');
    expect(appointment.memberId).toBe(memberId);
    expect(appointment.status).toBe('scheduled');

    const all = await appointmentService.getAllAppointments();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(appointment.id);
  });

  it('존재하지 않는 회원으로 예약 생성 시 에러', async () => {
    const data = {
      memberId: 'NOPE',
      start: '2024-05-10T10:00:00.000Z',
      end: '2024-05-10T11:00:00.000Z',
      status: 'scheduled'
    };
    await expect(appointmentService.createAppointment(data)).rejects.toThrow(AppError);
  });

  it('중복 예약 생성 시 에러', async () => {
    const data = {
      memberId,
      start: '2024-05-10T10:00:00.000Z',
      end: '2024-05-10T11:00:00.000Z',
      status: 'scheduled'
    };
    await appointmentService.createAppointment(data);
    await expect(appointmentService.createAppointment(data)).rejects.toThrow(AppError);
  });

  it('예약 상태를 수정할 수 있어야 한다', async () => {
    const data = {
      memberId,
      start: '2024-05-10T10:00:00.000Z',
      end: '2024-05-10T11:00:00.000Z',
      status: 'scheduled'
    };
    const appointment = await appointmentService.createAppointment(data);
    const updated = await appointmentService.updateAppointment(appointment.id, { status: 'completed' });
    expect(updated.status).toBe('completed');
  });

  it('존재하지 않는 예약 수정 시 에러', async () => {
    await expect(appointmentService.updateAppointment(9999, { status: 'completed' })).rejects.toThrow(AppError);
  });

  it('예약을 삭제할 수 있어야 한다', async () => {
    const data = {
      memberId,
      start: '2024-05-10T10:00:00.000Z',
      end: '2024-05-10T11:00:00.000Z',
      status: 'scheduled'
    };
    const appointment = await appointmentService.createAppointment(data);
    await appointmentService.deleteAppointment(appointment.id);
    const all = await appointmentService.getAllAppointments();
    expect(all.length).toBe(0);
  });

  it('존재하지 않는 예약 삭제 시 에러', async () => {
    await expect(appointmentService.deleteAppointment(9999)).rejects.toThrow(AppError);
  });
}); 