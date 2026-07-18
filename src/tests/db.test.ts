import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers';
import { users, competitions, registrations } from '@/db/schema';

describe('DB 스키마', () => {
  it('유저를 넣고 읽을 수 있다', () => {
    const db = createTestDb();
    db.insert(users).values({
      name: '홍길동', nickname: '길동', phone: '010-1234-5678',
      email: 'a@b.c', passwordHash: 'x',
    }).run();
    const all = db.select().from(users).all();
    expect(all).toHaveLength(1);
    expect(all[0].role).toBe('participant');
  });

  it('같은 대회에 같은 참가번호를 두 번 줄 수 없다', () => {
    const db = createTestDb();
    const [u1] = db.insert(users).values({ name: 'a', nickname: 'a', phone: '1', email: 'a', passwordHash: 'x' }).returning().all();
    const [u2] = db.insert(users).values({ name: 'b', nickname: 'b', phone: '2', email: 'b', passwordHash: 'x' }).returning().all();
    const [c] = db.insert(competitions).values({ slug: 'test', name: '테스트 대회' }).returning().all();
    db.insert(registrations).values({ userId: u1.id, competitionId: c.id, bibNumber: 100 }).run();
    expect(() =>
      db.insert(registrations).values({ userId: u2.id, competitionId: c.id, bibNumber: 100 }).run()
    ).toThrow();
  });
});
