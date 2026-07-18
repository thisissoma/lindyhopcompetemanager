import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers';
import { users } from '@/db/schema';
import { hashPassword, verifyPassword, createSession, getUserBySession } from '@/lib/auth';

describe('인증', () => {
  it('비밀번호 해시는 원문과 다르고 검증에 성공한다', async () => {
    const hash = await hashPassword('secret1234');
    expect(hash).not.toBe('secret1234');
    expect(await verifyPassword('secret1234', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('세션을 만들고 토큰으로 유저를 찾는다', () => {
    const db = createTestDb();
    const [u] = db.insert(users).values({ name: 'a', nickname: 'a', phone: '010', email: 'a', passwordHash: 'x' }).returning().all();
    const token = createSession(db, u.id);
    expect(getUserBySession(db, token)?.id).toBe(u.id);
    expect(getUserBySession(db, 'no-such-token')).toBeNull();
  });

  it('만료된 세션은 null을 반환한다', () => {
    const db = createTestDb();
    const [u] = db.insert(users).values({ name: 'a', nickname: 'a', phone: '010', email: 'a', passwordHash: 'x' }).returning().all();
    const token = createSession(db, u.id, -1000); // 이미 만료
    expect(getUserBySession(db, token)).toBeNull();
  });
});
