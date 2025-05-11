require('dotenv').config({ path: '.env.test' });

// 테스트 환경에서 사용할 전역 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_PATH = ':memory:';

const bcrypt = require('bcryptjs');
const knex = require('../db/knex');

beforeAll(async () => {
  // 기존 테이블 삭제
  await knex.schema.dropTableIfExists('sessionHistory');
  await knex.schema.dropTableIfExists('members');
  await knex.schema.dropTableIfExists('appointments');
  await knex.schema.dropTableIfExists('users');

  // users 테이블 생성
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('password').notNull();
    table.string('role').notNull();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(null);
  });

  // members 테이블 생성
  await knex.schema.createTable('members', (table) => {
    table.string('id', 7).primary();
    table.string('name').notNull();
    table.string('gender');
    table.date('birth_date');
    table.string('purpose');
    table.string('phone').notNull();
    table.text('notes');
    table.string('relationship');
    table.string('shared_with');
    table.integer('remaining_sessions');
    table.date('join_date');
    table.date('last_visit').defaultTo(null);
    table.string('address');
    table.text('memo');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(null);
  });

  // sessionHistory 테이블 생성 (카멜케이스로 변경)
  await knex.schema.createTable('sessionHistory', (table) => {
    table.increments('id').primary();
    table.string('memberId', 7).references('id').inTable('members');
    table.datetime('date');
    table.string('type');
    table.text('note');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // appointments 테이블 생성
  await knex.schema.createTable('appointments', (table) => {
    table.increments('id').primary();
    table.string('memberId', 7).references('id').inTable('members');
    table.date('date').notNull();
    table.time('time').notNull();
    table.string('type').defaultTo('일반');
    table.text('note');
    table.string('status').defaultTo('scheduled');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 테스트용 관리자 계정 생성
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await knex('users').insert({
    id: 'admin',
    password: hashedPassword,
    role: 'admin'
  });
});

afterAll(async () => {
  // 테이블 삭제
  await knex.schema.dropTableIfExists('sessionHistory');
  await knex.schema.dropTableIfExists('appointments');
  await knex.schema.dropTableIfExists('members');
  await knex.schema.dropTableIfExists('users');
  // DB 연결 종료
  await knex.destroy();
});
