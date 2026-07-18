import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, passwordResetRequests } from '@/db/schema';
import { requireStaff } from '@/lib/auth-server';
import { hashPassword, randomPassword } from '@/lib/auth';

const schema = z.object({ action: z.enum(['reset', 'dismiss']) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const id = Number((await params).id);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });

  const reqRow = db.select().from(passwordResetRequests).where(eq(passwordResetRequests.id, id)).get();
  if (!reqRow) return NextResponse.json({ error: '요청을 찾을 수 없습니다' }, { status: 404 });

  if (parsed.data.action === 'dismiss') {
    db.update(passwordResetRequests).set({ status: 'done' }).where(eq(passwordResetRequests.id, id)).run();
    return NextResponse.json({ ok: true });
  }

  // reset: 해당 번호 계정의 비밀번호를 랜덤 초기화하고 새 비번을 운영진에게 반환(오픈카톡으로 전달)
  const user = db.select().from(users).where(eq(users.phone, reqRow.phone)).get();
  if (!user) return NextResponse.json({ error: '해당 번호의 계정을 찾을 수 없습니다' }, { status: 404 });
  const newPassword = randomPassword();
  db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, user.id)).run();
  db.update(passwordResetRequests).set({ status: 'done' }).where(eq(passwordResetRequests.id, id)).run();
  return NextResponse.json({ newPassword, nickname: user.nickname });
}
