import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers';
import { users, competitions, divisions } from '@/db/schema';
import { registerForCompetition } from '@/lib/register';
import { confirmPayment } from '@/lib/payment';
import { checkIn, undoCheckIn } from '@/lib/checkin';

describe('체크인', () => {
  function setup() {
    const db = createTestDb();
    const compId = db.insert(competitions).values({ slug: 'c', name: '대회', status: 'open' }).returning().all()[0].id;
    const divId = db.insert(divisions).values({ competitionId: compId, name: 'M&M', kind: 'mnm' }).returning().all()[0].id;
    const userId = db.insert(users).values({ name: 'a', nickname: 'a', phone: '1', email: 'a', passwordHash: 'x' }).returning().all()[0].id;
    const reg = registerForCompetition(db, { userId, competitionId: compId, isOnsite: false, depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '', entries: [{ divisionId: divId, role: 'leader' }] });
    return { db, reg };
  }

  it('confirmed 참가자를 체크인하면 시각이 기록된다', () => {
    const { db, reg } = setup();
    confirmPayment(db, reg.id, reg.amountExpected);
    const r = checkIn(db, reg.id);
    expect(r.checkedInAt).toBeTruthy();
  });

  it('입금 확인 전에는 체크인할 수 없다', () => {
    const { db, reg } = setup();
    expect(() => checkIn(db, reg.id)).toThrow();
  });

  it('체크인 취소', () => {
    const { db, reg } = setup();
    confirmPayment(db, reg.id, reg.amountExpected);
    checkIn(db, reg.id);
    expect(undoCheckIn(db, reg.id).checkedInAt).toBeNull();
  });
});
