import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession, normalizePhone } from '@/lib/auth';

const schema = z.object({ phone: z.string(), password: z.string() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });
  const u = db.select().from(users).where(eq(users.phone, normalizePhone(parsed.data.phone))).get();
  if (!u || !(await verifyPassword(parsed.data.password, u.passwordHash)))
    return NextResponse.json({ error: '휴대폰번호 또는 비밀번호가 올바르지 않습니다' }, { status: 401 });
  const token = createSession(db, u.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/' });
  return res;
}
