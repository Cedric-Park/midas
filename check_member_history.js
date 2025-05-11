const knex = require('./src/config/database');

async function checkMemberHistory(memberId) {
  try {
    const member = await knex('members')
      .where('id', memberId)
      .first();

    if (!member) {
      console.log('회원을 찾을 수 없습니다.');
      return;
    }

    console.log(`\n회원 정보:`);
    console.log(`ID: ${member.id}`);
    console.log(`이름: ${member.name}`);
    console.log(`전화번호: ${member.phone}`);

    const history = await knex('sessionHistory')
      .where('memberId', memberId)
      .orderBy('date', 'desc');

    console.log('\n관리 내역:');
    history.forEach(session => {
      console.log(`날짜: ${session.date}`);
      console.log(`내용: ${session.note}`);
      console.log('---');
    });

    console.log(`\n총 ${history.length}개의 관리 내역이 있습니다.`);
  } catch (error) {
    console.error('에러 발생:', error);
  } finally {
    await knex.destroy();
  }
}

// 명령줄 인자로 회원 ID를 받음
const memberId = process.argv[2];
if (!memberId) {
  console.log('사용법: node check_member_history.js <회원ID>');
  process.exit(1);
}

checkMemberHistory(memberId); 