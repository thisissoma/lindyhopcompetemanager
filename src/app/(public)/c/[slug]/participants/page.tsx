import { notFound } from 'next/navigation';
import { db } from '@/db';
import { competitions, divisions, registrations, entries, users } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { calcFee } from '@/lib/fee';
import { calcDivisionPrize } from '@/lib/prize';
import { AppShell } from '@/components/ui/app-shell';
import { LogoBanner } from '@/components/ui/logo-banner';
import { competitionMenu } from '@/lib/competition-nav';

const ROLE_LABEL: Record<string, string> = { leader: '리더', follower: '팔뤄', solo: '솔로' };

// 부문 안에서 역할별 명단을 한 열로 세로 나열(신청 현황 스프레드시트 형식).
function RoleColumn({ label, names }: { label: string; names: string[] }) {
  return (
    <div className="text-center">
      <p className="mb-1 border-b border-border pb-1 text-xs font-bold text-primary">{label} ({names.length})</p>
      <ul className="flex flex-col text-sm">
        {names.map((n, i) => (
          <li key={i} className="py-0.5 text-ink">{n}</li>
        ))}
      </ul>
    </div>
  );
}

// 한 entry의 부문 참가비(입장료 제외)를 calcFee로 계산 — 신청 금액과 동일 규칙.
function entryFee(reg: { isOnsite: boolean }, div: any, entry: any): number {
  const r = calcFee({
    isOnsite: reg.isOnsite, includeEntryFee: false, entryFeePre: 0, entryFeeOnsite: 0,
    entries: [{
      divisionName: div.name, feePre: div.feePre, feeOnsite: div.feeOnsite, kind: div.kind,
      strictlyPayment: div.strictlyPayment, isStrictlyPayer: entry.isStrictlyPayer, isOnsiteAddition: entry.isOnsiteAddition,
    }],
  });
  return r.total;
}

export default async function ParticipantsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comp = db.select().from(competitions).where(eq(competitions.slug, slug)).get();
  if (!comp || comp.status === 'draft') notFound();

  const divs = db.select().from(divisions).where(eq(divisions.competitionId, comp.id)).orderBy(asc(divisions.sortOrder), asc(divisions.id)).all();

  // confirmed 등록만
  const regs = db.select().from(registrations).where(eq(registrations.competitionId, comp.id)).all()
    .filter((r) => r.status === 'confirmed');
  const regById = new Map(regs.map((r) => [r.id, r]));

  const sections = divs.map((div) => {
    const es = db.select().from(entries).where(eq(entries.divisionId, div.id)).all()
      .filter((e) => e.status === 'active' && regById.has(e.registrationId));
    const paidFees: number[] = [];
    const people = es.map((e) => {
      const reg = regById.get(e.registrationId)!;
      const u = db.select().from(users).where(eq(users.id, reg.userId)).get()!;
      // 입금완료(paid)인 신청만 상금 재원에 포함
      if (reg.paymentStatus === 'paid') paidFees.push(entryFee(reg, div, e));
      return { nickname: u.nickname, role: e.role as string, teamName: e.teamName, bibNumber: reg.bibNumber };
    });
    const prize = calcDivisionPrize(paidFees, comp.prizeRate);
    return { div, people, prize };
  });

  const totalPrize = sections.reduce((s, x) => s + x.prize, 0);

  return (
    <AppShell>
      <LogoBanner title={comp.name} logoUrl={comp.logoUrl || undefined} menu={competitionMenu(comp.slug, 'participants')} />
      <div className="mb-4 rounded-[10px] border border-border bg-surface p-3 text-sm">
        총 상금 <span className="font-extrabold text-primary">{totalPrize.toLocaleString()}원</span>
        <span className="text-muted"> (부문 참가비 × {Math.round(comp.prizeRate * 100)}%, 입장료 제외)</span>
      </div>

      <p className="mb-2 text-xs text-muted">부문을 눌러 명단을 펼쳐보세요.</p>
      <div className="flex flex-col gap-2">
        {sections.map(({ div, people, prize }) => (
          <details key={div.id} className="rounded-[10px] border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between p-3.5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <span className="text-muted transition-transform [details[open]_&]:rotate-90">▸</span>
                <span className="font-bold text-ink">{div.name}</span>
              </span>
              <span className="text-sm text-muted">상금 {prize.toLocaleString()}원 · {people.length}명</span>
            </summary>
            <div className="border-t border-border p-3.5">
              {people.length === 0 ? (
                <p className="text-sm text-muted">확정된 참가자가 아직 없습니다.</p>
              ) : (() => {
                // 듀오/트리오(team)는 팀명만 표시
                if (div.kind === 'team') {
                  const teams = people.map((p) => p.teamName).filter(Boolean);
                  return <RoleColumn label="팀" names={teams} />;
                }
                const leaders = people.filter((p) => p.role === 'leader').map((p) => p.nickname);
                const followers = people.filter((p) => p.role === 'follower').map((p) => p.nickname);
                const solos = people.filter((p) => p.role === 'solo').map((p) => p.nickname);
                // 리더/팔뤄가 있으면 2열, 솔로 부문이면 단일 열
                if (leaders.length > 0 || followers.length > 0) {
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <RoleColumn label="리더" names={leaders} />
                      <RoleColumn label="팔뤄" names={followers} />
                    </div>
                  );
                }
                return <RoleColumn label="참가자" names={solos} />;
              })()}
            </div>
          </details>
        ))}
      </div>
    </AppShell>
  );
}
