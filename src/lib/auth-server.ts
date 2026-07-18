import { cookies } from 'next/headers';
import { db as appDb } from '@/db';
import { getUserBySession } from '@/lib/auth';

// next/headers(쿠키)에 의존하는 서버 전용 헬퍼. vitest 대상 아님(auth.test.ts는 auth.ts만 로드).

export async function currentUser() {
  const token = (await cookies()).get('session')?.value;
  if (!token) return null;
  return getUserBySession(appDb, token);
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new Error('UNAUTHORIZED');
  return u;
}

export async function requireStaff() {
  const u = await requireUser();
  if (u.role !== 'staff' && u.role !== 'organizer') throw new Error('FORBIDDEN');
  return u;
}
