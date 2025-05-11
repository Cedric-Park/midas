const knex = require('./src/config/database');

async function checkSessionHistory() {
  try {
    const sessions = await knex('sessionHistory')
      .select('sessionHistory.*', 'members.name as memberName')
      .join('members', 'sessionHistory.memberId', 'members.id')
      .orderBy('sessionHistory.date', 'desc')
      .limit(20);

    console.log('최근 관리 내역 (최대 20개):');
    console.log('-------------------');
    
    sessions.forEach(session => {
      console.log(`날짜: ${session.date}`);
      console.log(`회원: ${session.memberName} (${session.memberId})`);
      console.log(`내용: ${session.note}`);
      console.log('-------------------');
    });

    const totalCount = await knex('sessionHistory').count('* as count').first();
    console.log(`\n전체 관리 내역 수: ${totalCount.count}`);
  } catch (error) {
    console.error('에러 발생:', error);
  } finally {
    await knex.destroy();
  }
}

checkSessionHistory(); 