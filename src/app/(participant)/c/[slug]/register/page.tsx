import { notFound, redirect } from 'next/navigation';
import { db } from '@/db';
import { competitions, divisions, registrations } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { currentUser } from '@/lib/auth-server';
import { AppShell } from '@/components/ui/app-shell';
import { LogoBanner } from '@/components/ui/logo-banner';
import { competitionMenu } from '@/lib/competition-nav';
import RegisterForm from './register-form';

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comp = db.select().from(competitions).where(eq(competitions.slug, slug)).get();
  if (!comp) notFound();

  const user = await currentUser();
  if (!user) redirect('/login');

  if (comp.status !== 'open') {
    return (
      <AppShell>
        <p className="text-muted">현재 접수중인 대회가 아닙니다.</p>
      </AppShell>
    );
  }

  const existing = db.select().from(registrations)
    .where(and(eq(registrations.userId, user.id), eq(registrations.competitionId, comp.id))).get();
  if (existing) redirect('/my');

  const divs = db.select().from(divisions).where(eq(divisions.competitionId, comp.id)).orderBy(asc(divisions.sortOrder), asc(divisions.id)).all();

  return (
    <AppShell>
      <LogoBanner title={comp.name} logoUrl={comp.logoUrl || undefined} menu={competitionMenu(comp.slug, 'register')} />
      <h1 className="mb-0.5 text-center text-xl font-extrabold text-primary">참가 신청</h1>
      <p className="mb-4 text-center text-xs text-muted">부문을 선택하면 예상 금액이 실시간으로 계산됩니다.</p>
      <RegisterForm
        competitionId={comp.id}
        entryFeePre={comp.entryFeePre}
        entryFeeOnsite={comp.entryFeeOnsite}
        collectsJudgeComment={comp.collectsJudgeComment}
        divisions={divs}
      />
    </AppShell>
  );
}
