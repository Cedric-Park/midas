const db = require('./src/db/knex');

async function checkAppointments() {
  try {
    // 모든 예약 조회
    const appointments = await db('appointments')
      .select('*')
      .orderBy('start', 'desc');
    
    console.log('현재 예약 목록:', appointments);

    // members 테이블의 ID 목록도 확인
    const members = await db('members')
      .select('id')
      .orderBy('id');
    
    console.log('\n회원 ID 목록:', members.map(m => m.id));
  } catch (error) {
    console.error('조회 중 오류 발생:', error);
  } finally {
    process.exit();
  }
}

checkAppointments(); 