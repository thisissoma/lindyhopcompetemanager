import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, like, or } from 'drizzle-orm';
import { db } from '@/db';
import { users, competitions, divisions, registrations, entries } from '@/db/schema';
import { requireStaff } from '@/lib/auth-server';
import { hashPassword } from '@/lib/auth';
import { registerForCompetition, addEntries } from '@/lib/register';
import { confirmPayment } from '@/lib/payment';
import { assignBib } from '@/lib/bib';
import { validateCompetitionEntries } from '@/lib/entry-validation';

const entrySchema = z.object({
  divisionId: z.number().int(),
  role: z.enum(['leader', 'follower', 'solo']),
  partnerNickname: z.string().optional(),
  teamName: z.string().optional(),
  isStrictlyPayer: z.boolean().optional(),
});

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('search'), competitionId: z.number().int(), query: z.string().min(1) }),
  z.object({
    action: z.literal('new'), competitionId: z.number().int(),
    name: z.string().min(1), nickname: z.string().min(1), phone: z.string().min(4),
    entries: z.array(entrySchema).min(1),
  }),
  z.object({ action: z.literal('add'), registrationId: z.number().int(), entries: z.array(entrySchema).min(1) }),
  z.object({ action: z.literal('confirmAndAssign'), registrationId: z.number().int(), amountPaid: z.number().int().nonnegative() }),
]);

export async function POST(req: Request) {
  try { await requireStaff(); } catch { return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }); }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 });
  const d = parsed.data;

  try {
    if (d.action === 'search') {
      const q = `%${d.query}%`;
      const found = db.select().from(users).where(or(like(users.phone, q), like(users.nickname, q), like(users.name, q))).all();
      const results = found.map((u) => {
        const reg = db.select().from(registrations).where(and(eq(registrations.userId, u.id), eq(registrations.competitionId, d.competitionId))).get();
        return { userId: u.id, name: u.name, nickname: u.nickname, phone: u.phone, registration: reg ?? null };
      });
      return NextResponse.json({ results });
    }

    if (d.action === 'new') {
      let user = db.select().from(users).where(eq(users.phone, d.phone)).get();
      if (!user) {
        const last4 = d.phone.replace(/\D/g, '').slice(-4) || '0000';
        [user] = db.insert(users).values({
          name: d.name, nickname: d.nickname, phone: d.phone, email: '',
          passwordHash: await hashPassword(last4),
        }).returning().all();
      }
      if (db.select().from(registrations).where(and(eq(registrations.userId, user.id), eq(registrations.competitionId, d.competitionId))).get())
        return NextResponse.json({ error: '이미 이 대회에 신청된 참가자입니다' }, { status: 409 });
      const newErr = validateCompetitionEntries(db, d.competitionId, d.entries);
      if (newErr) return NextResponse.json({ error: newErr }, { status: 400 });
      const reg = registerForCompetition(db, {
        userId: user.id, competitionId: d.competitionId, isOnsite: true,
        depositorName: d.name, wantsJudgeComment: false, feedbackEmail: '', inquiry: '',
        entries: d.entries,
      });
      return NextResponse.json({ registration: reg });
    }

    if (d.action === 'add') {
      const addReg = db.select().from(registrations).where(eq(registrations.id, d.registrationId)).get();
      if (!addReg) return NextResponse.json({ error: '신청 내역이 없습니다' }, { status: 404 });
      const addErr = validateCompetitionEntries(db, addReg.competitionId, d.entries);
      if (addErr) return NextResponse.json({ error: addErr }, { status: 400 });
      const { registration, addedAmount } = addEntries(db, d.registrationId, d.entries, { isOnsiteAddition: true });
      return NextResponse.json({ registration, addedAmount });
    }

    // confirmAndAssign
    const paid = confirmPayment(db, d.registrationId, d.amountPaid);
    if (paid.status !== 'confirmed') {
      return NextResponse.json({ error: `입금액이 예상액(${paid.amountExpected.toLocaleString()}원)과 다릅니다`, registration: paid }, { status: 400 });
    }
    const withBib = assignBib(db, d.registrationId);
    return NextResponse.json({ registration: withBib, bibNumber: withBib.bibNumber });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '처리 실패' }, { status: 400 });
  }
}
