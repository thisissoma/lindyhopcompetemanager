import { NextResponse } from 'next/server';
import { db } from '@/db';
import { requireStaff } from '@/lib/auth-server';
import { assignAllBibs } from '@/lib/bib';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const compId = Number((await params).id);
  try {
    const count = assignAllBibs(db, compId);
    return NextResponse.json({ assigned: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '처리 실패' }, { status: 400 });
  }
}
