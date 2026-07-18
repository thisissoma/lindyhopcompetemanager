import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireStaff } from '@/lib/auth-server';
import { hashPassword, normalizePhone, isValidPhone } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  nickname: z.string().min(1, '닉네임을 입력해주세요'),
  phone: z.string().min(1, '휴대폰번호를 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  role: z.enum(['staff', 'organizer']),
});

// 오거나이저가 운영진(스태프/오거나이저) 계정을 직접 생성.
export async function POST(req: Request) {
  let me;
  try { me = await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  if (me.role !== 'organizer')
    return NextResponse.json({ error: '오거나이저만 계정을 생성할 수 있습니다' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;
  const phone = normalizePhone(d.phone);
  if (!isValidPhone(phone))
    return NextResponse.json({ error: '휴대폰번호는 숫자만 11자리로 입력해주세요 (예: 01011112222)' }, { status: 400 });
  if (db.select().from(users).where(eq(users.phone, phone)).get())
    return NextResponse.json({ error: '이미 가입된 휴대폰번호입니다' }, { status: 409 });

  const [u] = db.insert(users).values({
    name: d.name, nickname: d.nickname, phone, email: '',
    passwordHash: await hashPassword(d.password), role: d.role,
  }).returning().all();
  return NextResponse.json({ id: u.id, nickname: u.nickname, role: u.role });
}
