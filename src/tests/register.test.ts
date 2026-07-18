import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './helpers';
import { users, competitions, divisions, registrations, entries } from '@/db/schema';
import { registerForCompetition, addEntries, cancelEntry, cancelRegistration } from '@/lib/register';
import { eq, and } from 'drizzle-orm';

let db: ReturnType<typeof createTestDb>;
let userId: number, compId: number, mnmId: number, strictlyId: number;

beforeEach(() => {
  db = createTestDb();
  userId = db.insert(users).values({ name: 'a', nickname: 'a', phone: '010', email: 'a', passwordHash: 'x' }).returning().all()[0].id;
  compId = db.insert(competitions).values({ slug: 'c', name: '대회', status: 'open', entryFeePre: 20000, entryFeeOnsite: 30000 }).returning().all()[0].id;
  mnmId = db.insert(divisions).values({ competitionId: compId, name: 'M&M', kind: 'mnm', feePre: 10000, feeOnsite: 15000 }).returning().all()[0].id;
  strictlyId = db.insert(divisions).values({ competitionId: compId, name: '스트릭', kind: 'strictly', feePre: 15000, feeOnsite: 20000 }).returning().all()[0].id;
});

describe('참가 신청', () => {
  it('신청하면 registration과 entries가 생기고 예상금액이 계산된다', () => {
    const reg = registerForCompetition(db, {
      userId, competitionId: compId, isOnsite: false, depositorName: '홍길동',
      wantsJudgeComment: true, feedbackEmail: 'a@b.c', inquiry: '',
      entries: [
        { divisionId: mnmId, role: 'leader' },
        { divisionId: strictlyId, role: 'leader', partnerNickname: '파트너', isStrictlyPayer: true },
      ],
    });
    expect(reg.amountExpected).toBe(20000 + 10000 + Math.floor(15000 / 2)); // split 기본값
    expect(db.select().from(entries).where(eq(entries.registrationId, reg.id)).all()).toHaveLength(2);
  });

  it('같은 대회에 두 번 신청할 수 없다', () => {
    const args = { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: mnmId, role: 'leader' as const }] };
    registerForCompetition(db, args);
    expect(() => registerForCompetition(db, args)).toThrow();
  });

  it('부문을 추가하면 entry가 늘고 금액이 재계산된다 (삭제 없음)', () => {
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: mnmId, role: 'leader' }] });
    expect(reg.amountExpected).toBe(20000 + 10000); // 입장료 + M&M 사전요금
    const { registration, addedAmount } = addEntries(db, reg.id, [{ divisionId: strictlyId, role: 'follower', partnerNickname: 'p', isStrictlyPayer: false }]);
    expect(addedAmount).toBe(Math.floor(15000 / 2)); // strictly split 사전요금
    expect(registration.amountExpected).toBe(20000 + 10000 + Math.floor(15000 / 2));
    expect(db.select().from(entries).where(eq(entries.registrationId, reg.id)).all()).toHaveLength(2);
  });

  it('부문을 취소하면 그 entry는 cancelled로 남고(삭제 아님) 금액이 줄어든다', () => {
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: mnmId, role: 'leader' }, { divisionId: strictlyId, role: 'leader', partnerNickname: 'p' }] });
    const entryToCancel = db.select().from(entries).where(and(eq(entries.registrationId, reg.id), eq(entries.divisionId, strictlyId))).get();
    const { registration } = cancelEntry(db, entryToCancel!.id);
    expect(registration.amountExpected).toBe(20000 + 10000); // strictly 빠짐
    const row = db.select().from(entries).where(eq(entries.id, entryToCancel!.id)).get();
    expect(row!.status).toBe('cancelled'); // 삭제되지 않고 상태만 변경
    expect(db.select().from(entries).where(eq(entries.registrationId, reg.id)).all()).toHaveLength(2); // row는 그대로
  });

  it('취소한 부문을 같은 부문으로 다시 추가할 수 있다 (유니크 인덱스 없음)', () => {
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: mnmId, role: 'leader' }] });
    const e = db.select().from(entries).where(eq(entries.registrationId, reg.id)).get();
    cancelEntry(db, e!.id);
    expect(() => addEntries(db, reg.id, [{ divisionId: mnmId, role: 'follower' }])).not.toThrow();
    const active = db.select().from(entries).where(and(eq(entries.registrationId, reg.id), eq(entries.status, 'active'))).all();
    expect(active).toHaveLength(1);
    expect(active[0].role).toBe('follower');
  });

  it('취소하면 status가 cancelled가 된다 (삭제 아님)', () => {
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: mnmId, role: 'leader' }] });
    cancelRegistration(db, reg.id);
    const row = db.select().from(registrations).where(eq(registrations.id, reg.id)).get();
    expect(row!.status).toBe('cancelled');
  });

  it('입금완료 후 취소하면 환불대기 상태가 된다', () => {
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: mnmId, role: 'leader' }] });
    db.update(registrations).set({ paymentStatus: 'paid', amountPaid: 30000 }).where(eq(registrations.id, reg.id)).run();
    cancelRegistration(db, reg.id);
    const row = db.select().from(registrations).where(eq(registrations.id, reg.id)).get();
    expect(row!.paymentStatus).toBe('refund_pending');
  });

  it('입금완료 후 부문을 추가하면 금액불일치(추가입금필요)로 바뀐다', () => {
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: mnmId, role: 'leader' }] });
    db.update(registrations).set({ paymentStatus: 'paid', amountPaid: reg.amountExpected, status: 'confirmed' }).where(eq(registrations.id, reg.id)).run();
    addEntries(db, reg.id, [{ divisionId: strictlyId, role: 'leader', partnerNickname: 'p' }]);
    const row = db.select().from(registrations).where(eq(registrations.id, reg.id)).get();
    expect(row!.paymentStatus).toBe('mismatch'); // 추가입금 필요
  });
});
