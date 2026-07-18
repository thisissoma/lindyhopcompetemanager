import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { requireStaff } from '@/lib/auth-server';
import { confirmPayment, markRefunded } from '@/lib/payment';

const schema = z.union([
  z.object({ action: z.literal('confirm'), amountPaid: z.number().int().nonnegative() }),
  z.object({ action: z.literal('refund') }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const regId = Number((await params).id);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });
  try {
    const r = parsed.data.action === 'confirm'
      ? confirmPayment(db, regId, parsed.data.amountPaid)
      : markRefunded(db, regId);
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '처리 실패' }, { status: 400 });
  }
}
