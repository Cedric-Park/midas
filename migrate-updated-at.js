const db = require('./src/db/knex');

async function migrate() {
  try {
    await db.schema.table('members', (table) => {
      table.timestamp('updated_at');
    });
    console.log('members 테이블에 updated_at 컬럼이 추가되었습니다.');
  } catch (error) {
    console.error('마이그레이션 실패:', error);
  } finally {
    process.exit();
  }
}

migrate(); 