const db = require('./src/db/knex');

async function fixSessionHistory() {
  try {
    await db.schema.table('sessionHistory', (table) => {
      table.timestamp('updated_at');
    });
    console.log('sessionHistory 테이블에 updated_at 컬럼이 추가되었습니다.');
  } catch (error) {
    console.error('마이그레이션 실패:', error);
  } finally {
    process.exit();
  }
}

fixSessionHistory(); 