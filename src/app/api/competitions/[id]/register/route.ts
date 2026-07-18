import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { competitions, registrations, entries } from '@/db/schema';
import { requireUser } from '@/lib/auth-server';
import { registerForCompetition, addEntries, cancelEntry, cancelRegistration } from '@/lib/register';
import { validateCompetitionEntries } from '@/lib/entry-validation';

const entrySchema = z.object({
  divisionId: z.number().int(),
  role: z.enum(['leader', 'follower', 'solo']),
  partnerNickname: z.string().optional(),
  teamName: z.string().optional(),
  isStrictlyPayer: z.boolean().optional(),
});

const postSchema = z.object({
  depositorName: z.string().default(''),
  wantsJudgeComment: z.boolean().default(false),
  feedbackEmail: z.string().default(''),
  inquiry: z.string().default(''),
  entries: z.array(entrySchema).min(1),
});

const putSchema = z.object({
  add: z.array(entrySchema).optional(),
  cancelEntryIds: z.array(z.number().int()).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireUser(); } catch { return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 }); }
  const compId = Number((await params).id);
  const comp = db.select().from(competitions).where(eq(competitions.id, compId)).get();
  if (!comp) return NextResponse.json({ error: '대회를 찾을 수 없습니다' }, { status: 404 });
  if (comp.status !== 'open') return NextResponse.json({ error: '접수중인 대회가 아닙니다' }, { status: 403 });

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });
  const err = validateCompetitionEntries(db, compId, parsed.data.entries);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  if (db.select().from(registrations).where(and(eq(registrations.userId, user.id), eq(registrations.competitionId, compId))).get())
    return NextResponse.json({ error: '이미 이 대회에 신청했습니다' }, { status: 409 });

  const reg = registerForCompetition(db, {
    userId: user.id, competitionId: compId, isOnsite: false,
    depositorName: parsed.data.depositorName, wantsJudgeComment: parsed.data.wantsJudgeComment,
    feedbackEmail: parsed.data.feedbackEmail, inquiry: parsed.data.inquiry,
    entries: parsed.data.entries,
  });
  return NextResponse.json(reg);
}

// 본인 등록 조회 (없거나 남의 것이면 null)
function ownRegistration(userId: number, compId: number) {
  return db.select().from(registrations)
    .where(and(eq(registrations.userId, userId), eq(registrations.competitionId, compId))).get();
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireUser(); } catch { return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 }); }
  const compId = Number((await params).id);
  const reg = ownRegistration(user.id, compId);
  if (!reg) return NextResponse.json({ error: '신청 내역이 없습니다' }, { status: 404 });
  if (reg.status === 'cancelled') return NextResponse.json({ error: '취소된 신청입니다' }, { status: 403 });

  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });

  if (parsed.data.cancelEntryIds?.length) {
    // 본인 등록의 entry만 취소
    const own = db.select().from(entries).where(eq(entries.registrationId, reg.id)).all().map((e) => e.id);
    for (const eid of parsed.data.cancelEntryIds) {
      if (own.includes(eid)) cancelEntry(db, eid);
    }
  }
  if (parsed.data.add?.length) {
    const err = validateCompetitionEntries(db, compId, parsed.data.add);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    addEntries(db, reg.id, parsed.data.add); // 사전 추가(현장 아님)
  }
  const updated = db.select().from(registrations).where(eq(registrations.id, reg.id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireUser(); } catch { return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 }); }
  const compId = Number((await params).id);
  const reg = ownRegistration(user.id, compId);
  if (!reg) return NextResponse.json({ error: '신청 내역이 없습니다' }, { status: 404 });
  cancelRegistration(db, reg.id);
  return NextResponse.json({ ok: true });
}
