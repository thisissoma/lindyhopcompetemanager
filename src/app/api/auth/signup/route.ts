import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createSession, normalizePhone, isValidPhone } from '@/lib/auth';

// 필드 순서는 가입 폼의 표시 순서와 일치시킨다(여러 필드가 비었을 때 맨 위 필드부터 에러 안내).
const schema = z.object({
  nickname: z.string().min(1, '닉네임을 입력해주세요'),
  phone: z.string().min(1, '휴대폰번호를 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  // 이메일은 선택입력(저지 코멘트 수신용). 값이 있으면 형식만 검증.
  email: z.string().optional().refine(
    (v) => !v || z.string().email().safeParse(v).success,
    '이메일 형식이 올바르지 않습니다',
  ),
  name: z.string().min(1, '실명을 입력해주세요'), // 입금자 확인용 실명
  swingStartDate: z.string().optional(),
  team: z.string().optional(),
});

const FIELD_LABEL: Record<string, string> = {
  nickname: '닉네임', phone: '휴대폰번호', password: '비밀번호',
  email: '이메일', name: '실명', swingStartDate: '스윙 시작 시기', team: '소속 팀',
};

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue.path[0] ?? '');
    // 커스텀 한글 메시지가 있으면 그대로, 없으면(예: 값 누락 시 zod 기본 영어) 필드명 기반 안내
    const msg = /[가-힣]/.test(issue.message)
      ? issue.message
      : `${FIELD_LABEL[field] ?? '입력값'} 항목을 확인해주세요`;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const d = parsed.data;
  const phone = normalizePhone(d.phone);
  if (!isValidPhone(phone))
    return NextResponse.json({ error: '휴대폰번호는 숫자만 11자리로 입력해주세요 (예: 01011112222)' }, { status: 400 });
  if (db.select().from(users).where(eq(users.phone, phone)).get())
    return NextResponse.json({ error: '이미 가입된 휴대폰번호입니다' }, { status: 409 });
  const [u] = db.insert(users).values({
    name: d.name, nickname: d.nickname, phone, email: d.email ?? '',
    passwordHash: await hashPassword(d.password),
    swingStartDate: d.swingStartDate, team: d.team,
  }).returning().all();
  const token = createSession(db, u.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/' });
  return res;
}
