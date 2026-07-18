import { NextResponse } from 'next/server';
import { db } from '@/db';
import { requireStaff } from '@/lib/auth-server';
import { createCompetition } from '@/lib/competition';

export async function POST(req: Request) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  try {
    const c = createCompetition(db, await req.json());
    return NextResponse.json(c);
  } catch (e: any) {
    if (e.message === 'DUPLICATE_SLUG') return NextResponse.json({ error: '이미 쓰이는 slug입니다' }, { status: 409 });
    return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });
  }
}
