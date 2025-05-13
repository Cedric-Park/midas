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

// JSON 문자열 안전하게 파싱
const safeJsonParse = (str, defaultValue = []) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON 파싱 오류:', error);
    return defaultValue;
  }
};

const memberService = {
  // 모든 회원 조회
  getAllMembers: async () => {
    try {
      return await db('members').select('*').orderBy('created_at', 'desc');
    } catch (error) {
      throw new AppError('회원 목록 조회에 실패했습니다.', 500);
    }
  },

  // 회원 검색
  searchMembers: async (searchTerm) => {
    return await db('members')
      .where('name', 'like', `%${searchTerm}%`)
      .orWhere('phone', 'like', `%${searchTerm}%`)
      .orderBy('name');
  },

  // 회원 상세 조회
  getMemberById: async (id) => {
    try {
      const member = await db('members').where({ id }).first();
      if (!member) {
        throw new AppError('회원을 찾을 수 없습니다.', 404);
      }
      return member;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('회원 조회에 실패했습니다.', 500);
    }
  },

  // 회원 생성
  createMember: async (memberData) => {
    try {
      console.log('받은 회원 데이터:', memberData);
      const id = generateId();
      const today = new Date().toISOString().split('T')[0];

      const insertData = {
        id,
        ...memberData,
        join_date: today,
        last_visit: today,
        remaining_sessions: memberData.remaining_sessions || 0,
        notes: memberData.notes || '',
        relationship: memberData.relationship || '',
        shared_with: memberData.shared_with || '[]',
        depends_on: '[]',
        created_at: db.fn.now()
      };

      console.log('생성할 회원 데이터:', insertData);

      try {
        const [newMember] = await db('members')
          .insert(insertData)
          .returning('*');

        console.log('생성된 회원:', newMember);
        return newMember;
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
      throw new AppError('회원 생성에 실패했습니다: ' + error.message, 400);
    }
  },

  // 회원 정보 수정
  updateMember: async (id, updateData) => {
    try {
      console.log('PATCH_DEBUG | [SERVER] updateData:', updateData);

      const member = await db('members').where({ id }).first();
      if (!member) {
        throw new AppError('회원을 찾을 수 없습니다.', 404);
      }

      // 기존 값 파싱
      const prevSharedWith = member.shared_with ? JSON.parse(member.shared_with) : [];
      const prevDependsOn = member.depends_on;
      const newSharedWith = updateData.shared_with ? (typeof updateData.shared_with === 'string' ? JSON.parse(updateData.shared_with) : updateData.shared_with) : [];
      const newDependsOn = updateData.depends_on || null;

      console.log('PATCH_DEBUG | [SERVER] prevSharedWith:', prevSharedWith);
      console.log('PATCH_DEBUG | [SERVER] newSharedWith:', newSharedWith);
      console.log('PATCH_DEBUG | [SERVER] prevDependsOn:', prevDependsOn);
      console.log('PATCH_DEBUG | [SERVER] newDependsOn:', newDependsOn);

      // shared_with 동기화: shared_with가 실제로 바뀌는 경우에만 실행
      if (
        typeof updateData.shared_with !== 'undefined' &&
        updateData.shared_with !== null &&
        updateData.shared_with !== ''
      ) {
        const removedMembers = prevSharedWith.filter(id => !newSharedWith.includes(id));
        console.log('PATCH_DEBUG | [SERVER] removedMembers:', removedMembers);
        // shared_with 동기화: 제거된 회원들의 depends_on에서 본인 ID만 업데이트
        for (const memberId of removedMembers) {
          const m = await db('members').where({ id: memberId }).first();
          if (m && m.depends_on === id) {
            await db('members').where({ id: memberId }).update({ depends_on: null, updated_at: db.fn.now() });
          }
        }
        // shared_with 동기화: 새로 추가된 회원들의 depends_on에 본인 ID만 업데이트
        for (const memberId of newSharedWith) {
          const m = await db('members').where({ id: memberId }).first();
          if (m && m.depends_on !== id) {
            await db('members').where({ id: memberId }).update({ depends_on: id, updated_at: db.fn.now() });
          }
        }
        // B(의존자)의 shared_with는 절대 업데이트하지 않음
      }
      // depends_on 동기화: depends_on이 실제로 바뀌는 경우에만 실행
      if (
        typeof updateData.depends_on !== 'undefined' &&
        updateData.depends_on !== null &&
        updateData.depends_on !== ''
      ) {
        // B(의존자)의 depends_on만 업데이트, shared_with는 건드리지 않음
      }

      // safeUpdateData 생성 직전
      const safeUpdateData = {
        ...updateData,
        updated_at: db.fn.now()
      };
      console.log('PATCH_DEBUG | [SERVER] safeUpdateData(생성직전):', safeUpdateData);

      // shared_with/depends_on이 undefined, null, 빈 문자열이거나 updateData에 없으면 safeUpdateData에서 삭제
      if (
        !('shared_with' in updateData) ||
        updateData.shared_with === undefined ||
        updateData.shared_with === null ||
        updateData.shared_with === ''
      ) {
        delete safeUpdateData.shared_with;
      } else {
        safeUpdateData.shared_with = typeof updateData.shared_with === 'string'
          ? updateData.shared_with
          : JSON.stringify(updateData.shared_with || []);
      }
      if (
        !('depends_on' in updateData) ||
        updateData.depends_on === undefined ||
        updateData.depends_on === null ||
        updateData.depends_on === ''
      ) {
        delete safeUpdateData.depends_on;
      } else {
        safeUpdateData.depends_on = updateData.depends_on;
      }

      // DB update 직전
      console.log('PATCH_DEBUG | [SERVER] 최종 DB update:', safeUpdateData);

      const [updatedMember] = await db('members')
        .where({ id })
        .update(safeUpdateData)
        .returning('*');

      return updatedMember;
    } catch (error) {
      console.error('회원 수정 중 오류:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('회원 정보 수정에 실패했습니다.', 500);
    }
  },

  // 회원 삭제
  deleteMember: async (id) => {
    try {
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
        const sharedWith = safeJsonParse(m.shared_with);
        const dependsOn = safeJsonParse(m.depends_on);
        
        if (sharedWith.includes(memberId) || dependsOn.includes(memberId)) {
          const updatedSharedWith = sharedWith.filter(id => id !== memberId);
          const updatedDependsOn = dependsOn.filter(id => id !== memberId);
          
          await db('members')
            .where({ id: m.id })
            .update({
              shared_with: JSON.stringify(updatedSharedWith),
              depends_on: JSON.stringify(updatedDependsOn),
              updated_at: db.fn.now()
            });
        }
      }

      // 회원 삭제
      await db('members').where({ id: memberId }).delete();
      console.log('회원 삭제 완료');

      return { 
        success: true,
        message: '회원이 삭제되었습니다.',
        deletedMemberId: memberId 
      };
    } catch (error) {
      console.error('회원 삭제 중 오류:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('회원 삭제에 실패했습니다.', 500);
    }
  },

  // 관리 횟수 업데이트
  updateRemainingSessions: async (id, remainingSessions) => {
    try {
      await db('members')
        .where('id', id)
        .update({
          remaining_sessions: remainingSessions,
          updated_at: new Date().toISOString(),
        });

      return await memberService.getMemberById(id);
    } catch (error) {
      console.error('관리 횟수 업데이트 중 오류:', error);
      throw new AppError('관리 횟수 업데이트에 실패했습니다.', 500);
    }
  },

  // 관리 내역 조회
  getSessionHistory: async (memberId) => {
    try {
      const history = await db('sessionHistory')
        .where('memberId', memberId)
        .orderBy('date', 'desc');
      
      return history;
    } catch (error) {
      console.error('세션 내역 조회 중 오류:', error);
      throw new AppError('세션 내역을 불러오는데 실패했습니다.', 500);
    }
  },

  // 관리 내역 추가
  addSessionHistory: async (sessionData) => {
    try {
      console.log('세션 데이터:', sessionData);
      const id = Date.now().toString();
      await db('sessionHistory').insert({
        id,
        memberId: sessionData.memberId,
        date: new Date(sessionData.date).toISOString(),
        note: sessionData.note
      });

      const newSession = await db('sessionHistory')
        .where('id', id)
        .first();
      console.log('생성된 세션:', newSession);
      return newSession;
    } catch (error) {
      console.error('세션 내역 추가 중 오류:', error);
      throw new Error('세션 내역을 추가하는데 실패했습니다.');
    }
  },

  // 관리 내역 수정
  updateSessionHistory: async (id, sessionData) => {
    try {
      const updateObj = { ...sessionData, updated_at: new Date().toISOString() };
      if (sessionData.date) {
        const d = new Date(sessionData.date);
        if (!isNaN(d)) {
          updateObj.date = d.toISOString();
        } else {
          // date 값이 유효하지 않으면 기존 값을 유지
          delete updateObj.date;
        }
      }
      await db('sessionHistory')
        .where('id', id)
        .update(updateObj);

      return await db('sessionHistory')
        .where('id', id)
        .first();
    } catch (error) {
      console.error('세션 내역 수정 중 오류:', error);
      throw new Error('세션 내역을 수정하는데 실패했습니다.');
    }
  },

  // 관리 내역 삭제
  deleteSessionHistory: async (id) => {
    try {
      return await db('sessionHistory')
        .where('id', id)
        .delete();
    } catch (error) {
      console.error('세션 내역 삭제 중 오류:', error);
      throw new Error('세션 내역을 삭제하는데 실패했습니다.');
    }
  },

  // 모든 관리 내역 조회
  getAllSessionHistory: async () => {
    try {
      const history = await db('sessionHistory')
        .orderBy('date', 'desc');
      return history;
    } catch (error) {
      console.error('세션 내역 조회 중 오류:', error);
      throw new Error('세션 내역을 불러오는데 실패했습니다.');
    }
  },
};

module.exports = memberService; 