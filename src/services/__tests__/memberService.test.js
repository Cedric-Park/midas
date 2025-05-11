const memberService = require('../memberService');
const db = require('../../db/knex');
const { AppError } = require('../../middleware/errorHandler');

// 각 테스트 전에 데이터베이스 초기화
beforeEach(async () => {
  await db('sessionHistory').del();
  await db('members').del();
});

// 테스트 후 데이터베이스 연결 종료
afterAll(async () => {
  await db.destroy();
});

describe('memberService', () => {
  describe('createMember', () => {
    it('새로운 회원을 생성해야 합니다', async () => {
      const memberData = {
        name: '홍길동',
        gender: 'M',
        birth_date: '1990-01-01',
        purpose: '치료',
        phone: '010-1234-5678'
      };

      const newMember = await memberService.createMember(memberData);

      expect(newMember).toHaveProperty('id');
      expect(newMember.name).toBe(memberData.name);
      expect(newMember.gender).toBe(memberData.gender);
      expect(newMember.birth_date).toBe(memberData.birth_date);
      expect(newMember.purpose).toBe(memberData.purpose);
      expect(newMember.phone).toBe(memberData.phone);
    });

    it('필수 필드가 누락된 경우 에러를 발생시켜야 합니다', async () => {
      const invalidMemberData = {
        name: '홍길동'
        // 필수 필드 누락
      };

      await expect(memberService.createMember(invalidMemberData))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getMemberById', () => {
    it('존재하는 회원을 조회해야 합니다', async () => {
      // 테스트 데이터 생성
      const memberData = {
        name: '홍길동',
        gender: 'M',
        birth_date: '1990-01-01',
        purpose: '치료',
        phone: '010-1234-5678'
      };
      const newMember = await memberService.createMember(memberData);

      // 회원 조회
      const foundMember = await memberService.getMemberById(newMember.id);

      expect(foundMember).toEqual(newMember);
    });

    it('존재하지 않는 회원 ID로 조회 시 에러를 발생시켜야 합니다', async () => {
      await expect(memberService.getMemberById('NONEXISTENT'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('updateMember', () => {
    it('회원 정보를 성공적으로 수정해야 합니다', async () => {
      // 테스트 데이터 생성
      const memberData = {
        name: '홍길동',
        gender: 'M',
        birth_date: '1990-01-01',
        purpose: '치료',
        phone: '010-1234-5678'
      };
      const newMember = await memberService.createMember(memberData);

      // 수정할 데이터
      const updateData = {
        name: '김철수',
        phone: '010-8765-4321'
      };

      const updatedMember = await memberService.updateMember(newMember.id, updateData);

      expect(updatedMember.name).toBe(updateData.name);
      expect(updatedMember.phone).toBe(updateData.phone);
      expect(updatedMember.gender).toBe(memberData.gender); // 변경되지 않은 필드
    });

    it('존재하지 않는 회원 수정 시 에러를 발생시켜야 합니다', async () => {
      const updateData = {
        name: '김철수'
      };

      await expect(memberService.updateMember('NONEXISTENT', updateData))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('deleteMember', () => {
    it('회원을 성공적으로 삭제해야 합니다', async () => {
      // 테스트 데이터 생성
      const memberData = {
        name: '홍길동',
        gender: 'M',
        birth_date: '1990-01-01',
        purpose: '치료',
        phone: '010-1234-5678'
      };
      const newMember = await memberService.createMember(memberData);

      // 회원 삭제
      await memberService.deleteMember(newMember.id);

      // 삭제 확인
      await expect(memberService.getMemberById(newMember.id))
        .rejects
        .toThrow(AppError);
    });

    it('존재하지 않는 회원 삭제 시 에러를 발생시켜야 합니다', async () => {
      await expect(memberService.deleteMember('NONEXISTENT'))
        .rejects
        .toThrow(AppError);
    });
  });
});

describe('sessionHistory 서비스', () => {
  let memberId;
  beforeEach(async () => {
    // 테스트용 회원 생성
    const member = await memberService.createMember({
      name: '테스트회원',
      gender: 'F',
      birth_date: '2000-01-01',
      purpose: '테스트',
      phone: '010-0000-0000'
    });
    memberId = member.id;
  });

  it('세션 내역을 추가하고 조회할 수 있어야 한다', async () => {
    const sessionData = {
      memberId,
      date: '2024-05-10T10:00:00.000Z',
      note: '첫 번째 관리'
    };
    const newSession = await memberService.addSessionHistory(sessionData);
    expect(newSession).toHaveProperty('id');
    expect(newSession.memberId).toBe(memberId);
    expect(newSession.note).toBe('첫 번째 관리');

    const history = await memberService.getSessionHistory(memberId);
    expect(history.length).toBe(1);
    expect(history[0].note).toBe('첫 번째 관리');
  });

  it('세션 내역을 수정할 수 있어야 한다', async () => {
    const sessionData = {
      memberId,
      date: '2024-05-10T10:00:00.000Z',
      note: '수정 전'
    };
    const newSession = await memberService.addSessionHistory(sessionData);
    const updated = await memberService.updateSessionHistory(newSession.id, {
      memberId,
      date: '2024-05-10T11:00:00.000Z',
      note: '수정 후'
    });
    expect(updated.note).toBe('수정 후');
    expect(updated.date).toContain('2024-05-10T11:00:00');
  });

  it('세션 내역을 삭제할 수 있어야 한다', async () => {
    const sessionData = {
      memberId,
      date: '2024-05-10T10:00:00.000Z',
      note: '삭제 테스트'
    };
    const newSession = await memberService.addSessionHistory(sessionData);
    await memberService.deleteSessionHistory(newSession.id);
    const history = await memberService.getSessionHistory(memberId);
    expect(history.length).toBe(0);
  });
}); 