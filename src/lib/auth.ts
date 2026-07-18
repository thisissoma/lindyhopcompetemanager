import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { sessions, users } from '@/db/schema';

// DB는 인자로 받는다(테스트에서 인메모리 db 주입 가능). next/headers에 의존하는 헬퍼는 auth-server.ts에 분리.

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// 휴대폰번호는 숫자만 저장/조회한다(하이픈·공백 제거). 로그인 아이디로 쓰임.
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// 국내 휴대폰: 01로 시작하는 10~11자리 숫자.
export function isValidPhone(phone: string): boolean {
  return /^01\d{8,9}$/.test(phone);
}

// 비밀번호 초기화용 랜덤 문자열(혼동되는 0/O/1/l/I 제외).
export function randomPassword(len = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += chars[bytes[i] % chars.length];
  return s;
}

const THIRTY_DAYS_MS = 30 * 24 * 3600 * 1000;

export function createSession(db: any, userId: number, ttlMs: number = THIRTY_DAYS_MS): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  db.insert(sessions).values({ token, userId, expiresAt }).run();
  return token;
}

export function getUserBySession(db: any, token: string) {
  const row = db.select().from(sessions).where(eq(sessions.token, token)).get();
  if (!row || row.expiresAt < new Date().toISOString()) return null;
  return db.select().from(users).where(eq(users.id, row.userId)).get() ?? null;
}
