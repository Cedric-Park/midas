const request = require('supertest');
const app = require('../expressApp');
const knex = require('../db/knex');

describe('API 엔드포인트 테스트', () => {
  beforeEach(async () => {
    // 데이터만 삭제
    await knex('sessionHistory').del();
    await knex('members').del();
    // 테스트 회원 생성
    await knex('members').insert({
      id: 'TEST001',
      name: '테스트 회원',
      gender: '남',
      birth_date: '1990-01-01',
      purpose: '치료',
      phone: '010-1234-5678',
      join_date: '2024-01-01'
    });
    // 테스트 세션 생성
    await knex('sessionHistory').insert({
      id: 'SESS001',
      memberId: 'TEST001',
      date: new Date(),
      note: '테스트 세션'
    });
  });

  describe('회원 API', () => {
    test('GET /members - 모든 회원 조회', async () => {
      const response = await request(app)
        .get('/members')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name', '테스트 회원');
    });

    test('GET /members/:id - 특정 회원 조회', async () => {
      const response = await request(app)
        .get('/members/TEST001')
        .expect(200);

      expect(response.body).toHaveProperty('name', '테스트 회원');
      expect(response.body).toHaveProperty('id', 'TEST001');
    });

    test('POST /members - 새 회원 생성', async () => {
      const newMember = {
        name: '새 회원',
        gender: '여',
        birth_date: '1995-01-01',
        purpose: '통증',
        phone: '010-9876-5432',
        join_date: '2024-01-01',
        last_visit: '2024-01-01',
        relationship: '지인',
        notes: '새 회원 노트',
        remaining_sessions: 5,
        shared_with: '[]'
      };

      const response = await request(app)
        .post('/members')
        .send(newMember)
        .expect(201);

      expect(response.body).toHaveProperty('name', '새 회원');
      expect(response.body).toHaveProperty('id');
    });

    test('PATCH /members/:id - 회원 정보 수정', async () => {
      const updateData = {
        name: '수정된 회원',
        notes: '수정된 노트'
      };

      const response = await request(app)
        .patch('/members/TEST001')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', '수정된 회원');
      expect(response.body).toHaveProperty('notes', '수정된 노트');
    });

    test('DELETE /members/:id - 회원 삭제', async () => {
      await request(app)
        .delete('/members/TEST001')
        .expect(204);

      const deletedMember = await knex('members').where('id', 'TEST001').first();
      expect(deletedMember).toBeUndefined();
    });
  });

  describe('세션 API', () => {
    test('GET /sessionHistory - 모든 세션 조회', async () => {
      const response = await request(app)
        .get('/sessionHistory')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('note', '테스트 세션');
    });

    test('GET /sessionHistory?memberId=:id - 특정 회원의 세션 조회', async () => {
      const response = await request(app)
        .get('/sessionHistory?memberId=TEST001')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('memberId', 'TEST001');
    });

    test('POST /sessionHistory - 새 세션 생성', async () => {
      const newSession = {
        memberId: 'TEST001',
        date: new Date(),
        note: '새 세션'
      };

      const response = await request(app)
        .post('/sessionHistory')
        .send(newSession)
        .expect(201);

      expect(response.body).toHaveProperty('note', '새 세션');
      expect(response.body).toHaveProperty('memberId', 'TEST001');
    });

    test('PATCH /sessionHistory/:id - 세션 수정', async () => {
      const updateData = {
        note: '수정된 세션'
      };

      const response = await request(app)
        .patch('/sessionHistory/SESS001')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('note', '수정된 세션');
    });

    test('DELETE /sessionHistory/:id - 세션 삭제', async () => {
      await request(app)
        .delete('/sessionHistory/SESS001')
        .expect(204);

      const deletedSession = await knex('sessionHistory').where('id', 'SESS001').first();
      expect(deletedSession).toBeUndefined();
    });
  });
}); 