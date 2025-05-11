const knex = require('./src/config/database');

async function checkSpecificMember(memberId) {
  try {
    const member = await knex('members')
      .where('id', memberId)
      .first();

    if (!member) {
      console.log('회원을 찾을 수 없습니다.');
      return;
    }

    console.log('\n회원 상세 정보:');
    console.log('-------------------');
    console.log(`ID: ${member.id}`);
    console.log(`이름: ${member.name}`);
    console.log(`성별: ${member.gender}`);
    console.log(`생년월일: ${member.birth_date}`);
    console.log(`목적: ${member.purpose}`);
    console.log(`전화번호: ${member.phone}`);
    console.log(`가입일: ${member.join_date}`);
    console.log(`최근 방문: ${member.last_visit}`);
    console.log(`관계: ${member.relationship}`);
    console.log(`남은 횟수: ${member.remaining_sessions}`);
    console.log(`메모: ${member.notes}`);
    console.log(`공유 대상: ${member.shared_with}`);
    console.log('-------------------');
  } catch (error) {
    console.error('에러 발생:', error);
  } finally {
    await knex.destroy();
  }
}

const memberId = process.argv[2];
if (!memberId) {
  console.log('사용법: node check_specific_member.js <회원ID>');
  process.exit(1);
}

checkSpecificMember(memberId); 