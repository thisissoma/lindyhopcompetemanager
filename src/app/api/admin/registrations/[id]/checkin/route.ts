import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { requireStaff } from '@/lib/auth-server';
import { checkIn, undoCheckIn } from '@/lib/checkin';

const schema = z.object({ action: z.enum(['checkin', 'undo']) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const regId = Number((await params).id);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });
  try {
    const r = parsed.data.action === 'checkin' ? checkIn(db, regId) : undoCheckIn(db, regId);
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '처리 실패' }, { status: 400 });
  }
}
