const db = require('./src/db/knex');

async function deleteAppointments() {
  try {
    // 먼저 members 테이블의 ID 목록을 가져옵니다
    const members = await db('members').select('id');
    const validMemberIds = members.map(m => m.id);

    // 잘못된 memberId를 가진 예약들을 조회
    const appointments = await db('appointments')
      .whereNotIn('memberId', validMemberIds)
      .select('*');
    
    console.log('삭제할 예약 목록:', appointments);

    // 잘못된 memberId를 가진 예약 삭제
    const deleted = await db('appointments')
      .whereNotIn('memberId', validMemberIds)
      .del();

    console.log(`총 ${deleted}개의 예약이 삭제되었습니다.`);
  } catch (error) {
    console.error('예약 삭제 중 오류 발생:', error);
  } finally {
    process.exit();
  }
}

deleteAppointments();
