import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { registrations } from '@/db/schema';
import { requireStaff } from '@/lib/auth-server';
import { assignBib } from '@/lib/bib';

const schema = z.union([
  z.object({ action: z.literal('assign') }),
  z.object({ bibNumber: z.number().int().positive() }),
  z.object({ action: z.literal('clear') }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const regId = Number((await params).id);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });

  try {
    if ('bibNumber' in parsed.data) {
      // 수동 지정 — 대회 내 중복이면 DB unique 제약이 throw
      const [r] = db.update(registrations).set({ bibNumber: parsed.data.bibNumber }).where(eq(registrations.id, regId)).returning().all();
      return NextResponse.json(r);
    }
    if (parsed.data.action === 'clear') {
      const [r] = db.update(registrations).set({ bibNumber: null }).where(eq(registrations.id, regId)).returning().all();
      return NextResponse.json(r);
    }
    return NextResponse.json(assignBib(db, regId));
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE')) return NextResponse.json({ error: '이미 쓰인 번호입니다' }, { status: 409 });
    return NextResponse.json({ error: e.message ?? '처리 실패' }, { status: 400 });
  }
}
