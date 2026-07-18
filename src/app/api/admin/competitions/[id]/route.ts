import { NextResponse } from 'next/server';
import { db } from '@/db';
import { requireStaff } from '@/lib/auth-server';
import { updateCompetition } from '@/lib/competition';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const { id } = await params;
  try {
    const c = updateCompetition(db, Number(id), await req.json());
    return NextResponse.json(c);
  } catch {
    return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });
  }
}
