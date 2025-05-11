const knex = require('./src/db/knex');

async function migrateTimestamps() {
  try {
    console.log('Adding timestamps to members table...');
    
    // created_at과 updated_at 컬럼 추가
    await knex.schema.table('members', function(table) {
      table.timestamp('created_at');
      table.timestamp('updated_at');
    });
    
    // 기존 레코드에 현재 시간 설정
    const now = knex.fn.now();
    await knex('members').update({
      created_at: now,
      updated_at: now
    });
    
    console.log('Timestamps migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await knex.destroy();
  }
}

migrateTimestamps(); 