import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers';
import { users, competitions, divisions } from '@/db/schema';
import { nextAvailableBib, bibBandFor, assignBib } from '@/lib/bib';
import { registerForCompetition } from '@/lib/register';
import { confirmPayment } from '@/lib/payment';

describe('참가번호', () => {
  it('빈 번호 중 가장 작은 번호를 준다', () => {
    expect(nextAvailableBib([], 100, 500)).toBe(100);
    expect(nextAvailableBib([100, 101], 100, 500)).toBe(102);
  });

  it('취소로 빈 번호가 생기면 그 번호부터 재사용한다 (현장등록 케이스)', () => {
    expect(nextAvailableBib([100, 102, 103], 100, 500)).toBe(101);
  });

  it('번호대가 꽉 차면 에러', () => {
    expect(() => nextAvailableBib([100, 101], 100, 102)).toThrow();
  });

  it('역할별 번호대: 리더 100~499, 팔뤄 500~899, 솔로 900~', () => {
    const comp = { bibLeaderStart: 100, bibFollowerStart: 500, bibSoloStart: 900 };
    expect(bibBandFor('leader', comp)).toEqual({ start: 100, end: 500 });
    expect(bibBandFor('follower', comp)).toEqual({ start: 500, end: 900 });
    expect(bibBandFor('solo', comp)).toEqual({ start: 900, end: 10000 });
  });

  it('confirmed 참가자에게 역할별 번호를 순서대로 부여하고, 두 번 호출해도 번호가 바뀌지 않는다', () => {
    const db = createTestDb();
    const compId = db.insert(competitions).values({ slug: 'c', name: '대회', status: 'open' }).returning().all()[0].id;
    const divId = db.insert(divisions).values({ competitionId: compId, name: 'M&M', kind: 'mnm' }).returning().all()[0].id;
    const mkUser = (phone: string) => db.insert(users).values({ name: phone, nickname: phone, phone, email: 'a', passwordHash: 'x' }).returning().all()[0].id;
    const reg = (userId: number, role: 'leader' | 'follower') =>
      registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: divId, role }] });

    const r1 = reg(mkUser('1'), 'leader');
    const r2 = reg(mkUser('2'), 'follower');
    confirmPayment(db, r1.id, r1.amountExpected);
    confirmPayment(db, r2.id, r2.amountExpected);
    expect(assignBib(db, r1.id).bibNumber).toBe(100);
    expect(assignBib(db, r2.id).bibNumber).toBe(500);
    expect(assignBib(db, r1.id).bibNumber).toBe(100); // 재호출해도 동일
  });

  it('입금 확인 전에는 번호를 받을 수 없다', () => {
    const db = createTestDb();
    const compId = db.insert(competitions).values({ slug: 'c', name: '대회', status: 'open' }).returning().all()[0].id;
    const divId = db.insert(divisions).values({ competitionId: compId, name: 'M&M', kind: 'mnm' }).returning().all()[0].id;
    const userId = db.insert(users).values({ name: 'a', nickname: 'a', phone: '1', email: 'a', passwordHash: 'x' }).returning().all()[0].id;
    const r = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: divId, role: 'leader' }] });
    expect(() => assignBib(db, r.id)).toThrow();
  });
});
