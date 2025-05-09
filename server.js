const express = require('express');
const sqlite3 = require('better-sqlite3');
const cors = require('cors');
const app = express();

// 데이터베이스 연결 시도
let db;
try {
  db = new sqlite3('midas.db');
  console.log('데이터베이스 연결 성공');
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

// 회원 정보 업데이트 (PATCH)
app.patch('/members/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  try {
    const stmt = db.prepare(`UPDATE members SET ${updateFields} WHERE id = ?`);
    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '회원 정보가 성공적으로 업데이트되었습니다.' });
  } catch (error) {
    console.error('회원 정보 업데이트 실패:', error);
    res.status(500).json({ error: '회원 정보 업데이트에 실패했습니다.' });
  }
});

// 회원 등록
app.post('/members', (req, res) => {
  const { name, gender, birth_date, purpose, phone, join_date, last_visit, notes, remaining_sessions, relationship } = req.body;
  const id = Date.now().toString();
  
  try {
    db.prepare(`
      INSERT INTO members (
        id, name, gender, birth_date, purpose, phone, join_date, 
        last_visit, notes, remaining_sessions, relationship
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, gender, birth_date, purpose, phone, join_date,
      last_visit, notes, remaining_sessions, relationship
    );
    
    res.json({ 
      id, name, gender, birth_date, purpose, phone, join_date,
      last_visit, notes, remaining_sessions, relationship
    });
  } catch (error) {
    console.error('회원 등록 실패:', error);
    res.status(500).json({ error: '회원 등록에 실패했습니다.' });
  }
});

// 회원 삭제
app.delete('/members/:id', (req, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare('DELETE FROM members WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '회원이 성공적으로 삭제되었습니다.' });
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
  const { memberId } = req.query;
  
  if (!memberId) {
    return res.status(400).json({ error: 'memberId is required' });
  }

  try {
    const history = db.prepare(`
      SELECT * FROM sessionHistory 
      WHERE memberId = ? 
      ORDER BY date DESC
    `).all(memberId);
    
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다`);
}); 