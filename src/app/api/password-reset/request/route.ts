import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { passwordResetRequests } from '@/db/schema';
import { normalizePhone } from '@/lib/auth';

const schema = z.object({ phone: z.string().min(1), note: z.string().optional() });

// 공개 엔드포인트. 계정 존재 여부를 노출하지 않기 위해 항상 ok를 반환하고 요청만 남긴다.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '휴대폰번호를 입력해주세요' }, { status: 400 });
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: '휴대폰번호를 입력해주세요' }, { status: 400 });
  db.insert(passwordResetRequests).values({ phone, note: parsed.data.note ?? '' }).run();
  return NextResponse.json({ ok: true });
}
