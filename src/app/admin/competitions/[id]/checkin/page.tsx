import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { competitions, registrations, users } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import CheckinBoard, { type CheckinRow } from './checkin-board';

export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comp = db.select().from(competitions).where(eq(competitions.id, Number(id))).get();
  if (!comp) notFound();

  const regs = db.select().from(registrations)
    .where(and(eq(registrations.competitionId, comp.id), eq(registrations.status, 'confirmed')))
    .orderBy(asc(registrations.bibNumber))
    .all();

  const rows: CheckinRow[] = regs.map((reg) => {
    const u = db.select().from(users).where(eq(users.id, reg.userId)).get()!;
    return { id: reg.id, nickname: u.nickname, name: u.name, bibNumber: reg.bibNumber, checkedIn: reg.checkedInAt != null };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{comp.name} · 입장 체크인</h2>
        <Link href={`/admin/competitions/${comp.id}`} className="text-sm underline">대회 설정</Link>
      </div>
      <CheckinBoard rows={rows} />
    </div>
  );
}
