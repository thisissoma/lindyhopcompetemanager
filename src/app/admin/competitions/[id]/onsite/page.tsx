import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { competitions, divisions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import OnsiteDesk from './onsite-desk';

export default async function OnsitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comp = db.select().from(competitions).where(eq(competitions.id, Number(id))).get();
  if (!comp) notFound();
  const divs = db.select().from(divisions).where(eq(divisions.competitionId, comp.id)).orderBy(asc(divisions.sortOrder), asc(divisions.id)).all();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{comp.name} · 현장 데스크</h2>
        <Link href={`/admin/competitions/${comp.id}/registrations`} className="text-sm underline">신청자 관리</Link>
      </div>
      <OnsiteDesk
        competitionId={comp.id}
        divisions={divs.map((d) => ({ id: d.id, name: d.name, kind: d.kind, feeOnsite: d.feeOnsite }))}
      />
    </div>
  );
}
