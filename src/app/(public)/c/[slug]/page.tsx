import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { competitions, divisions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import ReactMarkdown from 'react-markdown';
import { groupDivisionsByDayVenue } from '@/lib/divisions';
import { competitionMenu } from '@/lib/competition-nav';
import { AppShell } from '@/components/ui/app-shell';
import { LogoBanner } from '@/components/ui/logo-banner';
import { Button } from '@/components/ui/button';
import { SectionGroup } from '@/components/ui/section-group';
import { DivisionCard } from '@/components/ui/division-card';

export default async function PublicCompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comp = db.select().from(competitions).where(eq(competitions.slug, slug)).get();
  if (!comp || comp.status === 'draft') notFound();

  const divs = db.select().from(divisions).where(eq(divisions.competitionId, comp.id)).orderBy(asc(divisions.sortOrder), asc(divisions.id)).all();

  return (
    <AppShell>
      <LogoBanner title={comp.name} logoUrl={comp.logoUrl || undefined} menu={competitionMenu(comp.slug, 'info')} />
      {comp.notice && (
        <div className="prose prose-sm mb-4 max-w-none text-ink prose-headings:text-primary prose-a:text-accent">
          <ReactMarkdown>{comp.notice}</ReactMarkdown>
        </div>
      )}
      <div className="mb-4 rounded-[10px] border border-border bg-surface p-3 text-sm text-muted">
        입장료 — 사전 {comp.entryFeePre.toLocaleString()}원 · 현장 {comp.entryFeeOnsite.toLocaleString()}원
      </div>

      {groupDivisionsByDayVenue(divs).map((g) => (
        <SectionGroup key={g.key} label={g.label}>
          {g.items.map((d) => (
            <DivisionCard
              key={d.id}
              name={d.name}
              kind={d.kind}
              meta={[d.description, d.kind === 'strictly' ? (d.strictlyPayment === 'split' ? '참가비 반반' : '한 명 전액') : ''].filter(Boolean).join(' · ') || undefined}
              fee={d.feePre}
            />
          ))}
        </SectionGroup>
      ))}

      <div className="mt-4 flex gap-2">
        {comp.status === 'open' ? (
          <Link href={`/c/${comp.slug}/register`}>
            <Button>참가 신청</Button>
          </Link>
        ) : (
          <Button variant="ghost" disabled>접수중이 아닙니다</Button>
        )}
        <Link href={`/c/${comp.slug}/participants`}>
          <Button variant="ghost">신청 현황 · 상금</Button>
        </Link>
      </div>
    </AppShell>
  );
}
