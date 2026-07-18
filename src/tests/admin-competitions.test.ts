import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers';
import { createCompetition, createDivision } from '@/lib/competition';

describe('대회/부문 생성', () => {
  it('필수값만 주면 기본값(상금 35%, 리더 100/팔뤄 500번대)으로 대회가 생성된다', () => {
    const db = createTestDb();
    const c = createCompetition(db, { slug: 'c1', name: '대회' });
    expect(c.prizeRate).toBeCloseTo(0.35);
    expect(c.bibLeaderStart).toBe(100);
    expect(c.bibFollowerStart).toBe(500);
  });

  it('잘못된 slug는 거부한다', () => {
    const db = createTestDb();
    expect(() => createCompetition(db, { slug: '대회!!', name: '대회' })).toThrow();
  });

  it('slug 중복은 거부한다', () => {
    const db = createTestDb();
    createCompetition(db, { slug: 'dup', name: 'A' });
    expect(() => createCompetition(db, { slug: 'dup', name: 'B' })).toThrow('DUPLICATE_SLUG');
  });

  it('strictly 부문은 지불방식 기본값이 split(반반)이다', () => {
    const db = createTestDb();
    const c = createCompetition(db, { slug: 'c1', name: '대회' });
    const d = createDivision(db, { competitionId: c.id, name: '린디 스트릭틀리', kind: 'strictly' });
    expect(d.strictlyPayment).toBe('split');
  });

  it('부문 kind가 목록 밖이면 거부한다', () => {
    const db = createTestDb();
    const c = createCompetition(db, { slug: 'c1', name: '대회' });
    expect(() => createDivision(db, { competitionId: c.id, name: 'x', kind: 'battle' as any })).toThrow();
  });
});
