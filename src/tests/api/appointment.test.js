const request = require('supertest');
const app = require('../../expressApp');
const db = require('../../db/knex');

beforeEach(async () => {
  await db('appointments').del();
  await db('members').del();
});

describe('예약 API', () => {
  describe('POST /api/appointments', () => {
    it('새로운 예약을 생성할 수 있어야 한다', async () => {
      // 회원 생성
      const memberRes = await request(app)
        .post('/api/members')
        .send({
          name: '예약회원',
          phone: '010-3333-4444',
          gender: 'F',
          birth_date: '1995-05-05',
          purpose: '상담',
          notes: '',
          relationship: '',
          shared_with: '',
          remaining_sessions: 0,
          join_date: '2023-01-01',
          last_visit: null,
          address: '',
          memo: ''
        });

      const memberId = memberRes.body.id;
      expect(memberId).toMatch(/^[A-Z0-9]{7}$/);

      const response = await request(app)
        .post('/api/appointments')
        .send({
          memberId,
          date: '2024-01-15T10:00:00.000Z',
          status: 'scheduled'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.memberId).toBe(memberId);
      expect(response.body.status).toBe('scheduled');
    });

    it('존재하지 않는 회원으로 예약 생성 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .send({
          memberId: 'NOPE',
          date: '2024-01-15T10:00:00.000Z',
          status: 'scheduled'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/appointments', () => {
    it('모든 예약을 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/appointments');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    it('예약 상태를 수정할 수 있어야 한다', async () => {
      // 회원 생성
      const memberRes = await request(app)
        .post('/api/members')
        .send({
          name: '예약회원',
          phone: '010-3333-4444',
          gender: 'F',
          birth_date: '1995-05-05',
          purpose: '상담',
          notes: '',
          relationship: '',
          shared_with: '',
          remaining_sessions: 0,
          join_date: '2023-01-01',
          last_visit: null,
          address: '',
          memo: ''
        });

      const memberId = memberRes.body.id;

      // 예약 생성
      const createRes = await request(app)
        .post('/api/appointments')
        .send({
          memberId,
          date: '2024-01-15T10:00:00.000Z',
          status: 'scheduled'
        });

      const appointmentId = createRes.body.id;

      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
    });

    it('존재하지 않는 예약 수정 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .put('/api/appointments/NOPE')
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    it('예약을 삭제할 수 있어야 한다', async () => {
      // 회원 생성
      const memberRes = await request(app)
        .post('/api/members')
        .send({
          name: '예약회원',
          phone: '010-3333-4444',
          gender: 'F',
          birth_date: '1995-05-05',
          purpose: '상담',
          notes: '',
          relationship: '',
          shared_with: '',
          remaining_sessions: 0,
          join_date: '2023-01-01',
          last_visit: null,
          address: '',
          memo: ''
        });

      const memberId = memberRes.body.id;

      // 예약 생성
      const createRes = await request(app)
        .post('/api/appointments')
        .send({
          memberId,
          date: '2024-01-15T10:00:00.000Z',
          status: 'scheduled'
        });

      const appointmentId = createRes.body.id;

      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`);

      expect(response.status).toBe(204);

      // 삭제 확인
      const getResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`);

      expect(getResponse.status).toBe(404);
    });

    it('존재하지 않는 예약 삭제 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .delete('/api/appointments/NOPE');

      expect(response.status).toBe(404);
    });
  });
}); 