import { eq, and, inArray } from 'drizzle-orm';
import { competitions, divisions, registrations, entries } from '@/db/schema';
import { calcFee, FeeEntryInput } from './fee';

export type EntryArg = {
  divisionId: number;
  role: 'leader' | 'follower' | 'solo';
  partnerNickname?: string;
  teamName?: string;
  isStrictlyPayer?: boolean;
};

export type RegisterArgs = {
  userId: number; competitionId: number; isOnsite: boolean;
  depositorName: string; wantsJudgeComment: boolean;
  feedbackEmail: string; inquiry: string;
  entries: EntryArg[];
};

// 등록의 active entry들 + 입장료로 amountExpected를 다시 계산 (모든 가감의 단일 진실 공급원).
// 각 entry의 적용 요금: isOnsiteAddition ? feeOnsite : feePre. 입장료: 등록 isOnsite 기준.
export function recomputeAmount(db: any, registrationId: number): number {
  const reg = db.select().from(registrations).where(eq(registrations.id, registrationId)).get();
  if (!reg) throw new Error('신청 내역이 없습니다');
  const comp = db.select().from(competitions).where(eq(competitions.id, reg.competitionId)).get();
  if (!comp) throw new Error('대회를 찾을 수 없습니다');
  const activeEntries = db.select().from(entries)
    .where(and(eq(entries.registrationId, registrationId), eq(entries.status, 'active'))).all();
  const divIds = activeEntries.map((e: any) => e.divisionId);
  const divs = divIds.length ? db.select().from(divisions).where(inArray(divisions.id, divIds)).all() : [];
  const feeEntries: FeeEntryInput[] = activeEntries.map((e: any) => {
    const d = divs.find((x: any) => x.id === e.divisionId);
    if (!d) throw new Error('부문을 찾을 수 없습니다');
    return {
      divisionName: d.name, feePre: d.feePre, feeOnsite: d.feeOnsite, kind: d.kind,
      strictlyPayment: d.strictlyPayment, isStrictlyPayer: e.isStrictlyPayer,
      isOnsiteAddition: e.isOnsiteAddition,
    };
  });
  const amountExpected = calcFee({
    isOnsite: reg.isOnsite, includeEntryFee: true,
    entryFeePre: comp.entryFeePre, entryFeeOnsite: comp.entryFeeOnsite,
    entries: feeEntries,
  }).total;
  const patch: Record<string, unknown> = { amountExpected };
  // 이미 입금완료(paid)였는데 부문 추가/철회로 금액이 달라지면 mismatch로 표시(추가입금/환불 필요).
  if (reg.paymentStatus === 'paid' && reg.amountPaid > 0 && reg.amountPaid !== amountExpected) {
    patch.paymentStatus = 'mismatch';
  }
  db.update(registrations).set(patch).where(eq(registrations.id, registrationId)).run();
  return amountExpected;
}

export function registerForCompetition(db: any, args: RegisterArgs) {
  const [reg] = db.insert(registrations).values({
    userId: args.userId, competitionId: args.competitionId, isOnsite: args.isOnsite,
    depositorName: args.depositorName, wantsJudgeComment: args.wantsJudgeComment,
    feedbackEmail: args.feedbackEmail, inquiry: args.inquiry,
  }).returning().all();
  for (const e of args.entries) {
    db.insert(entries).values({
      registrationId: reg.id, divisionId: e.divisionId, role: e.role,
      partnerNickname: e.partnerNickname, teamName: e.teamName ?? '', isStrictlyPayer: e.isStrictlyPayer ?? true,
      isOnsiteAddition: args.isOnsite, // 현장 신규등록이면 부문도 현장요금
    }).run();
  }
  const amountExpected = recomputeAmount(db, reg.id);
  return { ...reg, amountExpected };
}

// 부문 추가 (삭제 없음). 이미 같은 부문 active면 skip. isOnsiteAddition=true면 현장요금 적용.
export function addEntries(db: any, registrationId: number, entryArgs: EntryArg[], opts: { isOnsiteAddition?: boolean } = {}) {
  const reg = db.select().from(registrations).where(eq(registrations.id, registrationId)).get();
  if (!reg) throw new Error('신청 내역이 없습니다');
  const before = reg.amountExpected;
  const activeDivIds = new Set(
    db.select().from(entries).where(and(eq(entries.registrationId, registrationId), eq(entries.status, 'active'))).all().map((e: any) => e.divisionId),
  );
  for (const e of entryArgs) {
    if (activeDivIds.has(e.divisionId)) continue; // 같은 부문 active 중복 방지
    db.insert(entries).values({
      registrationId, divisionId: e.divisionId, role: e.role,
      partnerNickname: e.partnerNickname, teamName: e.teamName ?? '', isStrictlyPayer: e.isStrictlyPayer ?? true,
      isOnsiteAddition: opts.isOnsiteAddition ?? false,
    }).run();
    activeDivIds.add(e.divisionId);
  }
  const amountExpected = recomputeAmount(db, registrationId);
  const [registration] = db.select().from(registrations).where(eq(registrations.id, registrationId)).all();
  return { registration, addedAmount: amountExpected - before };
}

// 부문 취소 (삭제 아님, status만 변경). 금액 재계산.
export function cancelEntry(db: any, entryId: number) {
  const entry = db.select().from(entries).where(eq(entries.id, entryId)).get();
  if (!entry) throw new Error('부문 내역이 없습니다');
  const before = db.select().from(registrations).where(eq(registrations.id, entry.registrationId)).get()!.amountExpected;
  db.update(entries).set({ status: 'cancelled' }).where(eq(entries.id, entryId)).run();
  const amountExpected = recomputeAmount(db, entry.registrationId);
  const [registration] = db.select().from(registrations).where(eq(registrations.id, entry.registrationId)).all();
  return { registration, removedAmount: before - amountExpected };
}

export function cancelRegistration(db: any, registrationId: number) {
  const reg = db.select().from(registrations).where(eq(registrations.id, registrationId)).get();
  if (!reg) throw new Error('신청 내역이 없습니다');
  const paymentStatus = reg.paymentStatus === 'paid' ? 'refund_pending' : reg.paymentStatus;
  db.update(registrations).set({ status: 'cancelled', paymentStatus }).where(eq(registrations.id, registrationId)).run();
  db.update(entries).set({ status: 'cancelled' }).where(eq(entries.registrationId, registrationId)).run();
}
