const request = require('supertest');
const app = require('../../expressApp');
const db = require('../../db/knex');
const { AppError } = require('../../middleware/errorHandler');

beforeEach(async () => {
  await db('sessionHistory').del();
  await db('members').del();
});

afterAll(async () => {
  await db.destroy();
});

describe('세션 관리 API', () => {
  let memberId;
  let authToken;

  beforeEach(async () => {
    // 테스트용 회원 생성
    const [id] = await db('members').insert({
      id: 'MEM001',
      name: '홍길동',
      gender: 'M',
      birth_date: '1990-01-01',
      purpose: '상담',
      phone: '010-1234-5678',
      join_date: '2024-01-01'
    });
    memberId = 'MEM001';

    // 로그인하여 토큰 발급
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        id: 'admin',
        password: 'admin123'
      });
    authToken = loginResponse.body.token;
  });

  describe('POST /api/sessions', () => {
    it('새로운 세션을 생성할 수 있어야 한다', async () => {
      // 회원을 먼저 생성
      const memberRes = await request(app)
        .post('/api/members')
        .send({
          name: '세션회원',
          phone: '010-1111-2222',
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
        .post('/api/sessions')
        .send({
          memberId,
          date: '2024-01-15T10:00:00.000Z',
          note: '첫 번째 상담 세션'
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.memberId).toBe(memberId);
      expect(response.body.note).toBe('첫 번째 상담 세션');
    });

    it('인증되지 않은 요청은 거부되어야 한다', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          memberId,
          date: '2024-01-15T10:00:00.000Z',
          note: '첫 번째 상담 세션'
        });

      expect(response.status).toBe(401);
    });

    it('존재하지 않는 회원으로 세션 생성 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memberId: 'NOPE',
          date: '2024-01-15T10:00:00.000Z',
          note: '첫 번째 상담 세션'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/sessions', () => {
    beforeEach(async () => {
      // 테스트용 세션 생성
      await db('sessionHistory').insert([
        {
          id: 'SESS001',
          memberId,
          date: '2024-01-15T10:00:00.000Z',
          note: '첫 번째 상담 세션'
        },
        {
          id: 'SESS002',
          memberId,
          date: '2024-01-16T10:00:00.000Z',
          note: '두 번째 상담 세션'
        }
      ]);
    });

    it('모든 세션을 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('특정 회원의 세션을 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .query({ memberId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].memberId).toBe(memberId);
    });
  });

  describe('GET /api/sessions/:id', () => {
    beforeEach(async () => {
      // 테스트용 세션 생성
      await db('sessionHistory').insert({
        id: 'SESS001',
        memberId,
        date: '2024-01-15T10:00:00.000Z',
        note: '첫 번째 상담 세션'
      });
    });

    it('특정 세션의 정보를 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/sessions/SESS001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('SESS001');
      expect(response.body.memberId).toBe(memberId);
      expect(response.body.note).toBe('첫 번째 상담 세션');
    });

    it('존재하지 않는 세션 조회 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .get('/api/sessions/NOPE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/sessions/:id', () => {
    beforeEach(async () => {
      // 테스트용 세션 생성
      await db('sessionHistory').insert({
        id: 'SESS001',
        memberId,
        date: '2024-01-15T10:00:00.000Z',
        note: '첫 번째 상담 세션'
      });
    });

    it('세션 정보를 수정할 수 있어야 한다', async () => {
      const response = await request(app)
        .put('/api/sessions/SESS001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          note: '수정된 상담 세션 노트'
        });

      expect(response.status).toBe(200);
      expect(response.body.note).toBe('수정된 상담 세션 노트');
    });

    it('존재하지 않는 세션 수정 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .put('/api/sessions/NOPE')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          note: '수정된 상담 세션 노트'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    beforeEach(async () => {
      // 테스트용 세션 생성
      await db('sessionHistory').insert({
        id: 'SESS001',
        memberId,
        date: '2024-01-15T10:00:00.000Z',
        note: '첫 번째 상담 세션'
      });
    });

    it('세션을 삭제할 수 있어야 한다', async () => {
      const response = await request(app)
        .delete('/api/sessions/SESS001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // 삭제 확인
      const getResponse = await request(app)
        .get('/api/sessions/SESS001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('존재하지 않는 세션 삭제 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .delete('/api/sessions/NOPE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 