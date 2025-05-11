const knex = require('./src/config/database');

async function checkMembers() {
  try {
    const members = await knex('members')
      .select('*')
      .orderBy('name')
      .limit(10);

    console.log('회원 목록 (최대 10명):');
    members.forEach(member => {
      console.log(`ID: ${member.id}, 이름: ${member.name}, 전화번호: ${member.phone}`);
    });

    const totalCount = await knex('members').count('* as count').first();
    console.log(`\n전체 회원 수: ${totalCount.count}`);
  } catch (error) {
    console.error('에러 발생:', error);
  } finally {
    await knex.destroy();
  }
}

checkMembers(); 