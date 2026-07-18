import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { registrations, entries } from '@/db/schema';
import { requireStaff } from '@/lib/auth-server';
import { addEntries, cancelEntry } from '@/lib/register';
import { validateCompetitionEntries } from '@/lib/entry-validation';

const entrySchema = z.object({
  divisionId: z.number().int(),
  role: z.enum(['leader', 'follower', 'solo']),
  partnerNickname: z.string().optional(),
  teamName: z.string().optional(),
  isStrictlyPayer: z.boolean().optional(),
});
const postSchema = z.object({ entries: z.array(entrySchema).min(1), isOnsiteAddition: z.boolean().default(false) });
const patchSchema = z.object({ entryId: z.number().int(), action: z.literal('cancel') });

// 부문 추가 (사전요금/현장요금 선택). 운영진 대리 처리.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const regId = Number((await params).id);
  const reg = db.select().from(registrations).where(eq(registrations.id, regId)).get();
  if (!reg) return NextResponse.json({ error: '신청 내역이 없습니다' }, { status: 404 });
  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });

  const err = validateCompetitionEntries(db, reg.competitionId, parsed.data.entries);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const { registration, addedAmount } = addEntries(db, regId, parsed.data.entries, { isOnsiteAddition: parsed.data.isOnsiteAddition });
  return NextResponse.json({ registration, addedAmount });
}

// 부문 철회 (삭제 아님, status='cancelled').
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const regId = Number((await params).id);
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });
  const entry = db.select().from(entries).where(and(eq(entries.id, parsed.data.entryId), eq(entries.registrationId, regId))).get();
  if (!entry) return NextResponse.json({ error: '부문 내역이 없습니다' }, { status: 404 });
  const { registration, removedAmount } = cancelEntry(db, parsed.data.entryId);
  return NextResponse.json({ registration, removedAmount });
}
