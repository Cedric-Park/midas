const knex = require('./src/config/database');

async function checkUpdatedMembers() {
  try {
    const members = await knex('members')
      .whereNotNull('updated_at')
      .orderBy('updated_at', 'desc')
      .limit(10);

    console.log('최근 수정된 회원 목록 (최대 10명):');
    members.forEach(member => {
      console.log(`\nID: ${member.id}`);
      console.log(`이름: ${member.name}`);
      console.log(`수정일시: ${member.updated_at}`);
    });

    const totalCount = await knex('members')
      .whereNotNull('updated_at')
      .count('* as count')
      .first();
    
    console.log(`\n수정된 회원 수: ${totalCount.count}`);
  } catch (error) {
    console.error('에러 발생:', error);
  } finally {
    await knex.destroy();
  }
}

checkUpdatedMembers(); 