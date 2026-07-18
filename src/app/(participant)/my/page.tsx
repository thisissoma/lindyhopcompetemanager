import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { competitions, divisions, registrations, entries } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { currentUser } from '@/lib/auth-server';
import { AppShell } from '@/components/ui/app-shell';
import RegistrationCard from './registration-card';

export default async function MyPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  const regs = db.select().from(registrations).where(eq(registrations.userId, user.id)).orderBy(desc(registrations.id)).all();

  const cards = regs.map((reg) => {
    const comp = db.select().from(competitions).where(eq(competitions.id, reg.competitionId)).get()!;
    const es = db.select().from(entries).where(eq(entries.registrationId, reg.id)).all();
    const compDivs = db.select().from(divisions).where(eq(divisions.competitionId, reg.competitionId)).all();
    const activeDivIds = es.filter((e) => e.status === 'active').map((e) => e.divisionId);
    const entryRows = es.filter((e) => e.status === 'active').map((e) => ({
      id: e.id, divisionName: compDivs.find((d) => d.id === e.divisionId)?.name ?? '?',
      role: e.role, partnerNickname: e.partnerNickname ?? '', isOnsiteAddition: e.isOnsiteAddition,
    }));
    const availableDivs = compDivs
      .filter((d) => !activeDivIds.includes(d.id))
      .map((d) => ({ id: d.id, name: d.name, kind: d.kind }));
    return { reg, comp, entryRows, availableDivs };
  });

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-primary">내 신청 내역</h1>
        <Link href="/" className="text-sm font-semibold text-muted underline">홈</Link>
      </div>
      {cards.length === 0 ? (
        <p className="text-sm text-muted">아직 신청한 대회가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {cards.map((c) => (
            <RegistrationCard
              key={c.reg.id}
              competitionId={c.reg.competitionId}
              competitionName={c.comp.name}
              status={c.reg.status}
              paymentStatus={c.reg.paymentStatus}
              amountExpected={c.reg.amountExpected}
              amountPaid={c.reg.amountPaid}
              bibNumber={c.reg.bibNumber}
              entries={c.entryRows}
              availableDivisions={c.availableDivs}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
