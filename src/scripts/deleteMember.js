const db = require('../db/knex');

async function deleteMember() {
  try {
    const result = await db('members')
      .where('name', '이현준')
      .delete();
    
    console.log(`${result}명의 회원이 삭제되었습니다.`);
    process.exit(0);
  } catch (error) {
    console.error('삭제 중 오류 발생:', error);
    process.exit(1);
  }
}

deleteMember(); 