const fs = require('fs');

// db_info.json 파일 읽기
const data = JSON.parse(fs.readFileSync('db_info.json', 'utf8'));

console.log('=== db_info.json 파일 구조 ===');
for (const key in data) {
  if (Array.isArray(data[key])) {
    console.log(`${key}: ${data[key].length}개의 항목`);
  } else {
    console.log(`${key}: ${typeof data[key]}`);
  }
}

if (data.members && data.members.length > 0) {
  console.log('\n=== 첫 번째 회원 데이터 예시 ===');
  console.log(data.members[0]);
}
