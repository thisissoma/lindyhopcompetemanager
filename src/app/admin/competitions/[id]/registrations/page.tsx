import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { competitions, divisions, registrations, entries, users } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import RegistrationsTable, { type RegRow } from './registrations-table';

export default async function RegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comp = db.select().from(competitions).where(eq(competitions.id, Number(id))).get();
  if (!comp) notFound();

  const compDivs = db.select().from(divisions).where(eq(divisions.competitionId, comp.id))
    .orderBy(asc(divisions.sortOrder), asc(divisions.id)).all();
  const regs = db.select().from(registrations).where(eq(registrations.competitionId, comp.id)).orderBy(desc(registrations.id)).all();

  const rows: RegRow[] = regs.map((reg) => {
    const u = db.select().from(users).where(eq(users.id, reg.userId)).get()!;
    const es = db.select().from(entries).where(eq(entries.registrationId, reg.id)).all().filter((e) => e.status === 'active');
    return {
      id: reg.id, name: u.name, nickname: u.nickname, phone: u.phone,
      depositorName: reg.depositorName,
      entries: es.map((e) => ({
        divisionId: e.divisionId,
        divisionName: compDivs.find((d) => d.id === e.divisionId)?.name ?? '?',
        role: e.role, isOnsiteAddition: e.isOnsiteAddition,
      })),
      amountExpected: reg.amountExpected, amountPaid: reg.amountPaid,
      paymentStatus: reg.paymentStatus, status: reg.status, bibNumber: reg.bibNumber,
      isOnsite: reg.isOnsite,
    };
  });
  const divTabs = compDivs.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{comp.name} · 신청자 관리</h2>
        <Link href={`/admin/competitions/${comp.id}`} className="text-sm underline">대회 설정</Link>
      </div>
      <RegistrationsTable rows={rows} competitionId={comp.id} divisions={divTabs} />
    </div>
  );
}
