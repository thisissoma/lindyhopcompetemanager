import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireStaff } from '@/lib/auth-server';

const schema = z.object({ role: z.enum(['participant', 'staff', 'organizer']) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let me;
  try { me = await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  if (me.role !== 'organizer')
    return NextResponse.json({ error: '역할 변경은 오거나이저만 가능합니다' }, { status: 403 });
  const id = Number((await params).id);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });

  // 마지막 오거나이저 강등 방지(자기 자신 포함) — 잠김 방지
  const target = db.select().from(users).where(eq(users.id, id)).get();
  if (target?.role === 'organizer' && parsed.data.role !== 'organizer') {
    const organizerCount = db.select().from(users).where(eq(users.role, 'organizer')).all().length;
    if (organizerCount <= 1)
      return NextResponse.json({ error: '마지막 오거나이저는 역할을 바꿀 수 없습니다. 다른 오거나이저를 먼저 지정하세요.' }, { status: 400 });
  }

  const [u] = db.update(users).set({ role: parsed.data.role }).where(eq(users.id, id)).returning().all();
  return NextResponse.json({ id: u.id, role: u.role });
}
