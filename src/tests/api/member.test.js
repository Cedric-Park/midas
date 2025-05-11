const request = require('supertest');
const app = require('../../expressApp');
const db = require('../../db/knex');
const { AppError } = require('../../middleware/errorHandler');

beforeEach(async () => {
  await db('members').del();
});

afterAll(async () => {
  await db.destroy();
});

describe('회원 관리 API', () => {
  let authToken;

  beforeEach(async () => {
    // 로그인하여 토큰 발급
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        id: 'admin',
        password: 'admin123'
      });
    authToken = loginResponse.body.token;
  });

  describe('POST /api/members', () => {
    it('새로운 회원을 생성할 수 있어야 한다', async () => {
      const response = await request(app)
        .post('/api/members')
        .send({
          name: '홍길동',
          phone: '010-1234-5678',
          gender: 'M',
          birth_date: '1990-01-01',
          purpose: '치료',
          notes: '',
          relationship: '',
          shared_with: '',
          remaining_sessions: 0,
          join_date: '2023-01-01',
          last_visit: null,
          address: '',
          memo: ''
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(/^[A-Z0-9]{7}$/);
      expect(response.body.name).toBe('홍길동');
    });

    it('인증되지 않은 요청은 거부되어야 한다', async () => {
      const response = await request(app)
        .post('/api/members')
        .send({
          id: 'MEM001',
          name: '홍길동',
          gender: 'M',
          birth_date: '1990-01-01',
          purpose: '상담',
          phone: '010-1234-5678',
          join_date: '2024-01-01'
        });

      expect(response.status).toBe(401);
    });

    it('필수 필드가 누락된 경우 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          id: 'MEM001',
          name: '홍길동'
          // 필수 필드 누락
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/members', () => {
    beforeEach(async () => {
      // 테스트용 회원 생성
      await db('members').insert([
        {
          id: 'MEM001',
          name: '홍길동',
          gender: 'M',
          birth_date: '1990-01-01',
          purpose: '상담',
          phone: '010-1234-5678',
          join_date: '2024-01-01'
        },
        {
          id: 'MEM002',
          name: '김철수',
          gender: 'M',
          birth_date: '1995-01-01',
          purpose: '치료',
          phone: '010-8765-4321',
          join_date: '2024-01-02'
        }
      ]);
    });

    it('모든 회원을 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/members');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('이름으로 회원을 검색할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/members?search=홍길동');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].name).toBe('홍길동');
    });
  });

  describe('GET /api/members/:id', () => {
    beforeEach(async () => {
      // 테스트용 회원 생성
      await db('members').insert({
        id: 'MEM001',
        name: '홍길동',
        gender: 'M',
        birth_date: '1990-01-01',
        purpose: '상담',
        phone: '010-1234-5678',
        join_date: '2024-01-01'
      });
    });

    it('특정 회원의 정보를 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/members/MEM001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('MEM001');
      expect(response.body.name).toBe('홍길동');
    });

    it('존재하지 않는 회원 조회 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .get('/api/members/NOPE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/members/:id', () => {
    beforeEach(async () => {
      // 테스트용 회원 생성
      await db('members').insert({
        id: 'MEM001',
        name: '홍길동',
        gender: 'M',
        birth_date: '1990-01-01',
        purpose: '상담',
        phone: '010-1234-5678',
        join_date: '2024-01-01'
      });
    });

    it('회원 정보를 수정할 수 있어야 한다', async () => {
      const response = await request(app)
        .put('/api/members/MEM001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '홍길순',
          phone: '010-9999-9999'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('홍길순');
      expect(response.body.phone).toBe('010-9999-9999');
    });

    it('존재하지 않는 회원 수정 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .put('/api/members/NOPE')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '홍길순'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/members/:id', () => {
    it('회원을 삭제할 수 있어야 한다', async () => {
      // 회원을 먼저 생성
      const createRes = await request(app)
        .post('/api/members')
        .send({
          name: '삭제회원',
          phone: '010-0000-0000',
          gender: 'F',
          birth_date: '2000-01-01',
          purpose: '테스트',
          notes: '',
          relationship: '',
          shared_with: '',
          remaining_sessions: 0,
          join_date: '2023-01-01',
          last_visit: null,
          address: '',
          memo: ''
        });
      const memberId = createRes.body.id;
      const response = await request(app)
        .delete(`/api/members/${memberId}`);
      expect(response.status).toBe(200);
      // 삭제 확인
      const getResponse = await request(app)
        .get(`/api/members/${memberId}`);
      expect(getResponse.status).toBe(404);
    });

    it('존재하지 않는 회원 삭제 시 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .delete('/api/members/NOPE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 