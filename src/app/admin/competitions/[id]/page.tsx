import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { competitions, divisions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import CompetitionSettingsForm from './competition-settings-form';
import DivisionManager from './division-manager';
import { Button } from '@/components/ui/button';

export default async function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comp = db.select().from(competitions).where(eq(competitions.id, Number(id))).get();
  if (!comp) notFound();
  const divs = db.select().from(divisions).where(eq(divisions.competitionId, comp.id)).orderBy(asc(divisions.sortOrder), asc(divisions.id)).all();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-ink">{comp.name}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Link href={`/admin/competitions/${comp.id}/registrations`}>
          <Button variant="secondary" className="w-full py-4 text-base">신청자 관리</Button>
        </Link>
        <Link href={`/admin/competitions/${comp.id}/onsite`}>
          <Button variant="secondary" className="w-full py-4 text-base">현장 데스크</Button>
        </Link>
        <Link href={`/admin/competitions/${comp.id}/checkin`}>
          <Button variant="secondary" className="w-full py-4 text-base">체크인</Button>
        </Link>
        <Link href={`/c/${comp.slug}`}>
          <Button variant="ghost" className="w-full py-4 text-base">공개 페이지</Button>
        </Link>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted">대회 설정</h3>
        <CompetitionSettingsForm comp={comp} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted">부문</h3>
        <DivisionManager competitionId={comp.id} divisions={divs} />
      </section>
    </div>
  );
}
