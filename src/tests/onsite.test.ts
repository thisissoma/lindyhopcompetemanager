import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers';
import { users, competitions, divisions } from '@/db/schema';
import { registerForCompetition, addEntries } from '@/lib/register';

describe('현장 등록', () => {
  it('현장 신규등록은 현장요금으로 계산된다', () => {
    const db = createTestDb();
    const compId = db.insert(competitions).values({ slug: 'c', name: '대회', status: 'open', entryFeePre: 20000, entryFeeOnsite: 30000 }).returning().all()[0].id;
    const divId = db.insert(divisions).values({ competitionId: compId, name: 'M&M', kind: 'mnm', feePre: 10000, feeOnsite: 15000 }).returning().all()[0].id;
    const userId = db.insert(users).values({ name: 'a', nickname: 'a', phone: '1', email: 'a', passwordHash: 'x' }).returning().all()[0].id;
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: true, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: divId, role: 'leader' }] });
    expect(reg.amountExpected).toBe(45000);
  });

  it('사전등록자의 현장 부문추가는 추가 부문만 현장요금으로 합산된다', () => {
    const db = createTestDb();
    const compId = db.insert(competitions).values({ slug: 'c', name: '대회', status: 'open', entryFeePre: 20000, entryFeeOnsite: 30000 }).returning().all()[0].id;
    const d1 = db.insert(divisions).values({ competitionId: compId, name: 'M&M', kind: 'mnm', feePre: 10000, feeOnsite: 15000 }).returning().all()[0].id;
    const d2 = db.insert(divisions).values({ competitionId: compId, name: '솔로', kind: 'solo', feePre: 5000, feeOnsite: 8000 }).returning().all()[0].id;
    const userId = db.insert(users).values({ name: 'a', nickname: 'a', phone: '1', email: 'a', passwordHash: 'x' }).returning().all()[0].id;
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: d1, role: 'leader' }] });
    expect(reg.amountExpected).toBe(30000); // 20000 + 10000

    const { registration, addedAmount } = addEntries(db, reg.id, [{ divisionId: d2, role: 'solo' }], { isOnsiteAddition: true });
    expect(addedAmount).toBe(8000); // 현장요금
    expect(registration.amountExpected).toBe(38000);
  });

  it('사전등록자의 사전 부문추가는 사전요금으로 합산된다', () => {
    const db = createTestDb();
    const compId = db.insert(competitions).values({ slug: 'c', name: '대회', status: 'open', entryFeePre: 20000, entryFeeOnsite: 30000 }).returning().all()[0].id;
    const d1 = db.insert(divisions).values({ competitionId: compId, name: 'M&M', kind: 'mnm', feePre: 10000, feeOnsite: 15000 }).returning().all()[0].id;
    const d2 = db.insert(divisions).values({ competitionId: compId, name: '솔로', kind: 'solo', feePre: 5000, feeOnsite: 8000 }).returning().all()[0].id;
    const userId = db.insert(users).values({ name: 'a', nickname: 'a', phone: '1', email: 'a', passwordHash: 'x' }).returning().all()[0].id;
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: d1, role: 'leader' }] });
    const { addedAmount } = addEntries(db, reg.id, [{ divisionId: d2, role: 'solo' }]); // isOnsiteAddition 기본 false
    expect(addedAmount).toBe(5000); // 사전요금
  });
});
