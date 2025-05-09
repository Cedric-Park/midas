const express = require('express');
const sqlite3 = require('better-sqlite3');
const cors = require('cors');
const app = express();

// 데이터베이스 연결 시도
let db;
try {
  db = new sqlite3('midas.db', { verbose: null });
  console.log('데이터베이스 연결 성공');
  
  // 데이터베이스 설정 최적화
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 30000000000');
  db.pragma('page_size = 4096');
  db.pragma('cache_size = -2000'); // 2MB 캐시

  // members 테이블이 없으면 생성
  db.exec(`CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    phone TEXT NOT NULL,
    join_date TEXT NOT NULL,
    last_visit TEXT,
    remaining_sessions INTEGER DEFAULT 0,
    purpose TEXT,
    relationship TEXT,
    notes TEXT,
    shared_with TEXT
  )`);

  // appointments 테이블이 없으면 생성
  db.exec(`CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    memberId TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (memberId) REFERENCES members(id)
  )`);

  // sessionHistory 테이블이 없으면 생성
  db.exec(`CREATE TABLE IF NOT EXISTS sessionHistory (
    id TEXT PRIMARY KEY,
    memberId TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT NOT NULL,
    FOREIGN KEY (memberId) REFERENCES members(id)
  )`);

  // 인덱스 생성
  db.exec('CREATE INDEX IF NOT EXISTS idx_members_id ON members(id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone)');

  // 외래 키 제약 조건 다시 활성화
  db.pragma('foreign_keys = ON');

  // shared_with 컬럼이 없으면 추가
  try {
    db.exec('ALTER TABLE members ADD COLUMN shared_with TEXT');
  } catch (error) {
    // 컬럼이 이미 존재하는 경우 무시
    if (!error.message.includes('duplicate column name')) {
      throw error;
    }
  }

  // depends_on 컬럼이 없으면 추가
  try {
    db.exec('ALTER TABLE members ADD COLUMN depends_on TEXT');
  } catch (error) {
    // 컬럼이 이미 존재하는 경우 무시
    if (!error.message.includes('duplicate column name')) {
      throw error;
    }
  }

  // 인덱스 생성
  db.exec('CREATE INDEX IF NOT EXISTS idx_members_id ON members(id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone)');

} catch (error) {
  console.error('데이터베이스 연결 실패:', error);
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// 회원 목록 조회
app.get('/members', (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM members').all();
    res.json(members);
  } catch (error) {
    console.error('회원 목록 조회 실패:', error);
    res.status(500).json({ error: '회원 목록을 불러오는데 실패했습니다.' });
  }
});

// 회원 상세 조회
app.get('/members/:id', (req, res) => {
  const { id } = req.params;
  try {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    if (!member) {
      return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
    }
    res.json(member);
  } catch (error) {
    console.error('회원 상세 조회 실패:', error);
    res.status(500).json({ error: '회원 정보를 불러오는데 실패했습니다.' });
  }
});

// 회원 정보 수정
app.patch('/members/:id', (req, res) => {
  const { id } = req.params;
  const { name, gender, birth_date, purpose, phone, notes, relationship, shared_with, remaining_sessions } = req.body;
  
  console.log('회원 정보 수정 요청:', { id, name, gender, birth_date, purpose, phone, notes, relationship, shared_with, remaining_sessions });
  
  try {
    // 트랜잭션 시작
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // 현재 회원의 이전 shared_with 값을 가져옴
      const currentMember = db.prepare('SELECT shared_with FROM members WHERE id = ?').get(id.toString());
      const previousSharedWith = currentMember ? JSON.parse(currentMember.shared_with || '[]') : [];
      const newSharedWith = JSON.parse(shared_with || '[]');

      // 더 이상 공유되지 않는 회원들의 depends_on에서 현재 회원 ID 제거
      const removedMembers = previousSharedWith.filter(memberId => !newSharedWith.includes(memberId));
      for (const memberId of removedMembers) {
        const member = db.prepare('SELECT depends_on FROM members WHERE id = ?').get(memberId);
        if (member) {
          const dependsOn = JSON.parse(member.depends_on || '[]');
          const updatedDependsOn = dependsOn.filter(depId => depId !== id.toString());
          db.prepare('UPDATE members SET depends_on = ? WHERE id = ?').run(
            JSON.stringify(updatedDependsOn),
            memberId
          );
        }
      }

      // 새로 추가된 회원들의 depends_on에 현재 회원 ID 추가
      const addedMembers = newSharedWith.filter(memberId => !previousSharedWith.includes(memberId));
      for (const memberId of addedMembers) {
        const member = db.prepare('SELECT depends_on FROM members WHERE id = ?').get(memberId);
        if (member) {
          const dependsOn = JSON.parse(member.depends_on || '[]');
          if (!dependsOn.includes(id.toString())) {
            dependsOn.push(id.toString());
            db.prepare('UPDATE members SET depends_on = ? WHERE id = ?').run(
              JSON.stringify(dependsOn),
              memberId
            );
          }
        }
      }

      // 현재 회원 정보 업데이트
      const stmt = db.prepare(`
        UPDATE members 
        SET name = ?, 
            gender = ?, 
            birth_date = ?, 
            purpose = ?, 
            phone = ?, 
            notes = ?, 
            relationship = ?,
            shared_with = ?,
            remaining_sessions = ?
        WHERE id = ?
      `);
      
      const result = stmt.run(
        name,
        gender,
        birth_date,
        purpose,
        phone,
        notes,
        relationship,
        shared_with,
        remaining_sessions,
        id.toString()
      );
      
      console.log('업데이트 결과:', result);
      
      if (result.changes === 0) {
        db.prepare('ROLLBACK').run();
        return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
      }
      
      const updatedMember = db.prepare('SELECT * FROM members WHERE id = ?').get(id.toString());
      console.log('업데이트된 회원 정보:', updatedMember);
      
      // 트랜잭션 커밋
      db.prepare('COMMIT').run();
      
      res.json(updatedMember);
    } catch (error) {
      // 에러 발생 시 롤백
      db.prepare('ROLLBACK').run();
      console.error('SQL 실행 중 오류:', error);
      throw error;
    }
  } catch (error) {
    console.error('회원 정보 수정 실패:', error);
    res.status(500).json({ 
      error: '회원 정보 수정에 실패했습니다.',
      details: error.message 
    });
  }
});

// 회원 등록
app.post('/members', (req, res) => {
  const { name, gender, birth_date, purpose, phone, relationship, shared_with, remaining_sessions } = req.body;
  
  try {
    // 7자리 랜덤 문자열 생성 (대문자 알파벳과 숫자)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 7; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const stmt = db.prepare(`
      INSERT INTO members (
        id, name, gender, birth_date, purpose, phone, relationship, shared_with, remaining_sessions, join_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%d', 'now'))
    `);
    
    const result = stmt.run(
      id,
      name, gender, birth_date, purpose, phone, relationship, shared_with, remaining_sessions || 0
    );
    
    const newMember = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    res.json(newMember);
  } catch (error) {
    console.error('회원 등록 실패:', error);
    res.status(500).json({ error: '회원 등록에 실패했습니다.' });
  }
});

// 회원 삭제
app.delete('/members/:id', (req, res) => {
  const { id } = req.params;
  try {
    // 트랜잭션 시작
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // 1. 관련된 세션 내역 삭제
      db.prepare('DELETE FROM sessionHistory WHERE memberId = ?').run(id);
      
      // 2. 관련된 예약 삭제
      db.prepare('DELETE FROM appointments WHERE memberId = ?').run(id);
      
      // 3. 회원 삭제
      const result = db.prepare('DELETE FROM members WHERE id = ?').run(id);
      
      if (result.changes === 0) {
        db.prepare('ROLLBACK').run();
        return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
      }
      
      // 트랜잭션 커밋
      db.prepare('COMMIT').run();
      
      res.json({ message: '회원이 성공적으로 삭제되었습니다.' });
    } catch (error) {
      // 에러 발생 시 롤백
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('회원 삭제 실패:', error);
    res.status(500).json({ error: '회원 삭제에 실패했습니다.' });
  }
});

// 예약 목록 조회
app.get('/appointments', (req, res) => {
  try {
    // 예약, 회원 정보, 세션내역을 함께 조회
    const appointments = db.prepare(`
      SELECT 
        a.*,
        m.name as memberName,
        m.gender,
        m.birth_date,
        m.purpose,
        m.phone,
        m.remaining_sessions,
        m.relationship,
        m.join_date,
        m.last_visit,
        m.notes,
        (
          SELECT json_group_array(json_object(
            'id', sh.id,
            'date', sh.date,
            'note', sh.note
          ))
          FROM sessionHistory sh
          WHERE sh.memberId = a.memberId
          ORDER BY sh.date DESC
        ) as sessionHistory
      FROM appointments a
      LEFT JOIN members m ON a.memberId = m.id
      ORDER BY a.start DESC
    `).all();

    // JSON 문자열을 실제 배열로 변환
    const result = appointments.map(appointment => ({
      ...appointment,
      sessionHistory: JSON.parse(appointment.sessionHistory || '[]')
    }));

    res.json(result);
  } catch (error) {
    console.error('예약 목록 조회 실패:', error);
    res.status(500).json({ error: '예약 목록을 불러오는데 실패했습니다.' });
  }
});

// 예약 생성
app.post('/appointments', (req, res) => {
  const { memberId, start, end, status = 'scheduled' } = req.body;
  const id = Date.now().toString();
  
  try {
    db.prepare(`
      INSERT INTO appointments (id, memberId, start, end, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, memberId, start, end, status);
    
    res.json({ id, memberId, start, end, status });
  } catch (error) {
    console.error('예약 생성 실패:', error);
    res.status(500).json({ error: '예약 생성에 실패했습니다.' });
  }
});

// 예약 취소 (PATCH)
app.patch('/appointments/:id', (req, res) => {
  const { status } = req.body;
  
  try {
    const result = db.prepare(`
      UPDATE appointments 
      SET status = ? 
      WHERE id = ?
    `).run(status, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('예약 상태 변경 실패:', error);
    res.status(500).json({ error: '예약 상태 변경에 실패했습니다.' });
  }
});

// 예약 삭제
app.delete('/appointments/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('예약 삭제 실패:', error);
    res.status(500).json({ error: '예약 삭제에 실패했습니다.' });
  }
});

// 세션 내역 조회
app.get('/sessionHistory', (req, res) => {
  const { memberId, startDate } = req.query;
  
  if (!memberId) {
    return res.status(400).json({ error: 'memberId is required' });
  }

  try {
    let query = `
      SELECT * FROM sessionHistory 
      WHERE memberId = ? 
    `;
    const params = [memberId];

    if (startDate) {
      query += ` AND date >= ?`;
      params.push(startDate);
    }

    query += ` ORDER BY date DESC LIMIT 100`;

    const history = db.prepare(query).all(...params);
    
    res.json(history);
  } catch (error) {
    console.error('세션 내역 조회 실패:', error);
    res.status(500).json({ error: '세션 내역을 불러오는데 실패했습니다.' });
  }
});

// 세션 내역 추가
app.post('/sessionHistory', (req, res) => {
  const { memberId, date, note } = req.body;
  const id = Date.now().toString();
  
  try {
    db.prepare(`
      INSERT INTO sessionHistory (id, memberId, date, note)
      VALUES (?, ?, ?, ?)
    `).run(id, memberId, date, note);
    
    res.json({ id, memberId, date, note });
  } catch (error) {
    console.error('세션 내역 추가 실패:', error);
    res.status(500).json({ error: '세션 내역 추가에 실패했습니다.' });
  }
});

// 세션 내역 삭제
app.delete('/sessionHistory/:id', (req, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare('DELETE FROM sessionHistory WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '세션 내역을 찾을 수 없습니다.' });
    }
    res.json({ message: '세션 내역이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('세션 내역 삭제 실패:', error);
    res.status(500).json({ error: '세션 내역 삭제에 실패했습니다.' });
  }
});

// 세션 내역 수정
app.patch('/sessionHistory/:id', (req, res) => {
  const { id } = req.params;
  const { date, note } = req.body;
  try {
    const result = db.prepare('UPDATE sessionHistory SET date = ?, note = ? WHERE id = ?').run(date, note, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '세션 내역을 찾을 수 없습니다.' });
    }
    // 수정된 row 반환
    const updated = db.prepare('SELECT * FROM sessionHistory WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('세션 내역 수정 실패:', error);
    res.status(500).json({ error: '세션 내역 수정에 실패했습니다.' });
  }
});

// 세션 완료 API
app.post('/completeSession', (req, res) => {
  const { memberId, date, note } = req.body;
  
  try {
    // 회원 정보 조회
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    if (!member) {
      return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
    }

    // 연결된 회원이 있는지 확인
    let targetMemberId = memberId;
    if (member.depends_on) {
      const dependsOn = JSON.parse(member.depends_on);
      if (dependsOn.length > 0) {
        targetMemberId = dependsOn[0]; // 첫 번째 의존하는 회원의 관리 횟수 사용
      }
    }

    // 연결된 회원의 관리 횟수 차감
    db.prepare(
      'UPDATE members SET remaining_sessions = remaining_sessions - 1 WHERE id = ?'
    ).run(targetMemberId);

    // 세션 기록 추가
    db.prepare(
      'INSERT INTO sessionHistory (memberId, date, note) VALUES (?, ?, ?)'
    ).run(memberId, date, note);

    // 연결된 회원의 세션 기록에도 추가
    if (targetMemberId !== memberId) {
      const targetMember = db.prepare('SELECT name FROM members WHERE id = ?').get(targetMemberId);
      if (targetMember) {
        db.prepare(
          'INSERT INTO sessionHistory (memberId, date, note) VALUES (?, ?, ?)'
        ).run(targetMemberId, date, `${member.name}님이 관리 횟수 1회 사용`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('세션 완료 처리 중 오류 발생:', error);
    res.status(500).json({ error: '세션 완료 처리 중 오류가 발생했습니다.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다`);
}); 