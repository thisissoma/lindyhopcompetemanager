import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { competitions, divisions, registrations, entries, users } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import RegistrationEditor from './registration-editor';

export default async function RegistrationDetailPage({ params }: { params: Promise<{ id: string; regId: string }> }) {
  const { id, regId } = await params;
  const comp = db.select().from(competitions).where(eq(competitions.id, Number(id))).get();
  if (!comp) notFound();
  const reg = db.select().from(registrations).where(eq(registrations.id, Number(regId))).get();
  if (!reg || reg.competitionId !== comp.id) notFound();
  const u = db.select().from(users).where(eq(users.id, reg.userId)).get()!;

  const compDivs = db.select().from(divisions).where(eq(divisions.competitionId, comp.id))
    .orderBy(asc(divisions.sortOrder), asc(divisions.id)).all();
  const es = db.select().from(entries).where(eq(entries.registrationId, reg.id)).all();
  const activeDivIds = es.filter((e) => e.status === 'active').map((e) => e.divisionId);
  const activeEntries = es.filter((e) => e.status === 'active').map((e) => ({
    id: e.id, divisionName: compDivs.find((d) => d.id === e.divisionId)?.name ?? '?',
    role: e.role, partnerNickname: e.partnerNickname ?? '', isOnsiteAddition: e.isOnsiteAddition,
  }));
  const available = compDivs.filter((d) => !activeDivIds.includes(d.id))
    .map((d) => ({ id: d.id, name: d.name, kind: d.kind, feePre: d.feePre, feeOnsite: d.feeOnsite }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">
          {u.nickname} <span className="text-sm text-muted">{u.name} · {u.phone}</span>
        </h2>
        <Link href={`/admin/competitions/${comp.id}/registrations`} className="text-sm underline">신청자 목록</Link>
      </div>
      <RegistrationEditor
        registrationId={reg.id}
        paymentStatus={reg.paymentStatus}
        status={reg.status}
        amountExpected={reg.amountExpected}
        amountPaid={reg.amountPaid}
        bibNumber={reg.bibNumber}
        depositorName={reg.depositorName}
        entries={activeEntries}
        available={available}
      />
    </div>
  );
}
