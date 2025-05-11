const request = require('supertest');
const app = require('../../expressApp');
const db = require('../../db/knex');

beforeEach(async () => {
  await db('sessionHistory').del();
  await db('members').del();
  
  // 테스트용 회원 생성
  const [memberId] = await db('members').insert({
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
  }).returning('id');

  // 테스트용 세션 생성
  await db('sessionHistory').insert({
    memberId,
    date: '2024-01-15',
    note: '테스트 세션'
  });
});

describe('통계 API', () => {
  describe('GET /api/statistics/daily', () => {
    it('일별 통계를 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/statistics/daily')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('totalMembers');
    });

    it('날짜 범위가 없으면 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .get('/api/statistics/daily');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/statistics/monthly', () => {
    it('월별 통계를 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/statistics/monthly')
        .query({ year: 2024, month: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('totalMembers');
    });

    it('연도와 월이 없으면 에러가 발생해야 한다', async () => {
      const response = await request(app)
        .get('/api/statistics/monthly');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/statistics/members', () => {
    it('회원별 통계를 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/statistics/members');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
}); 