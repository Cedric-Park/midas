const db = require('../db/knex');
const { AppError } = require('../middleware/errorHandler');

// ID 생성 함수
const generateId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 7; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

exports.createMember = async (req, res, next) => {
  try {
    console.log('회원 생성 요청 받음:', req.body);
    const { name, phone, birth_date, gender, purpose, notes, relationship, shared_with, remaining_sessions } = req.body;

    if (!name || !phone) {
      throw new AppError('이름과 전화번호는 필수 입력 항목입니다.', 400);
    }

    // ID 생성
    const id = generateId();
    const today = new Date().toISOString().split('T')[0];

    const memberData = {
      id,
      name,
      phone,
      birth_date,
      gender,
      purpose,
      notes: notes || '',
      relationship: relationship || '',
      shared_with: shared_with || '[]',
      depends_on: null,
      remaining_sessions: remaining_sessions || 0,
      join_date: today,
      last_visit: today,
      created_at: db.fn.now()
    };

    console.log('생성할 회원 데이터:', memberData);

    try {
      const [member] = await db('members').insert(memberData).returning('*');
      console.log('생성된 회원:', member);
      res.status(201).json(member);
    } catch (dbError) {
      console.error('데이터베이스 오류:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        table: dbError.table,
        constraint: dbError.constraint
      });
      throw new AppError('데이터베이스 오류가 발생했습니다: ' + dbError.message, 500);
    }
  } catch (error) {
    console.error('회원 생성 중 오류:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    next(error);
  }
};

exports.getMembers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = db('members').select('*');

    if (search) {
      query = query.where('name', 'like', `%${search}%`);
    }

    const members = await query.orderBy('created_at', 'desc');
    res.status(200).json(members);
  } catch (error) {
    next(error);
  }
};

exports.getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await db('members').where({ id }).first();

    if (!member) {
      throw new AppError('회원을 찾을 수 없습니다.', 404);
    }

    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
};

exports.updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, birth_date, gender, purpose, notes, relationship, shared_with, depends_on, remaining_sessions } = req.body;

    const member = await db('members').where({ id }).first();
    if (!member) {
      throw new AppError('회원을 찾을 수 없습니다.', 404);
    }

    const [updatedMember] = await db('members')
      .where({ id })
      .update({
        name,
        phone,
        birth_date,
        gender,
        purpose,
        notes,
        relationship,
        shared_with: shared_with || '[]',
        depends_on: depends_on || null,
        remaining_sessions,
        updated_at: db.fn.now()
      })
      .returning('*');

    res.status(200).json(updatedMember);
  } catch (error) {
    next(error);
  }
};

exports.deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('삭제 요청된 회원 ID:', id);

    if (!id) {
      throw new AppError('회원 ID가 필요합니다.', 400);
    }

    // ID를 문자열로 변환
    const memberId = String(id);
    
    // 회원 존재 여부 확인
    const member = await db('members').where({ id: memberId }).first();
    console.log('조회된 회원:', member);

    if (!member) {
      throw new AppError('회원을 찾을 수 없습니다.', 404);
    }

    // 먼저 이 회원을 참조하는 다른 회원들의 shared_with와 depends_on 업데이트
    const allMembers = await db('members').select('*');
    for (const m of allMembers) {
      const sharedWith = JSON.parse(m.shared_with || '[]');
      const dependsOn = m.depends_on;
      
      if (sharedWith.includes(memberId) || dependsOn === memberId) {
        const updatedSharedWith = sharedWith.filter(id => id !== memberId);
        
        await db('members')
          .where({ id: m.id })
          .update({
            shared_with: JSON.stringify(updatedSharedWith),
            depends_on: dependsOn === memberId ? null : dependsOn,
            updated_at: db.fn.now()
          });
      }
    }

    // 회원 삭제
    await db('members').where({ id: memberId }).delete();
    console.log('회원 삭제 완료');

    res.status(200).json({ 
      message: '회원이 삭제되었습니다.',
      deletedMemberId: memberId 
    });
  } catch (error) {
    console.error('회원 삭제 중 오류:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('회원 삭제에 실패했습니다.', 500));
    }
  }
}; 