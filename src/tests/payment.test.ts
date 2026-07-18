import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './helpers';
import { users, competitions, divisions, registrations } from '@/db/schema';
import { registerForCompetition, cancelRegistration } from '@/lib/register';
import { confirmPayment, markRefunded } from '@/lib/payment';
import { eq } from 'drizzle-orm';

let db: ReturnType<typeof createTestDb>;
let regId: number;

beforeEach(() => {
  db = createTestDb();
  const userId = db.insert(users).values({ name: 'a', nickname: 'a', phone: '010', email: 'a', passwordHash: 'x' }).returning().all()[0].id;
  const compId = db.insert(competitions).values({ slug: 'c', name: '대회', status: 'open', entryFeePre: 20000 }).returning().all()[0].id;
  const divId = db.insert(divisions).values({ competitionId: compId, name: 'M&M', kind: 'mnm', feePre: 10000 }).returning().all()[0].id;
  regId = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '홍길동', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: divId, role: 'leader' }] }).id;
});

describe('입금 관리', () => {
  it('예상액과 같은 금액이 확인되면 paid + confirmed', () => {
    const r = confirmPayment(db, regId, 30000);
    expect(r.paymentStatus).toBe('paid');
    expect(r.status).toBe('confirmed');
  });

  it('금액이 다르면 mismatch, 신청은 pending 유지', () => {
    const r = confirmPayment(db, regId, 25000);
    expect(r.paymentStatus).toBe('mismatch');
    expect(r.status).toBe('pending');
    expect(r.amountPaid).toBe(25000);
  });

  it('환불 완료 처리', () => {
    confirmPayment(db, regId, 30000);
    cancelRegistration(db, regId);
    const r = markRefunded(db, regId);
    expect(r.paymentStatus).toBe('refunded');
  });
});
