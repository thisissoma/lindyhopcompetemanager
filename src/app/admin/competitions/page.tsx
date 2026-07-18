import Link from 'next/link';
import { db } from '@/db';
import { competitions } from '@/db/schema';
import { desc } from 'drizzle-orm';
import NewCompetitionForm from './new-competition-form';
import { Card, CardBody } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';

const STATUS_LABEL: Record<string, string> = {
  draft: '준비중', open: '접수중', closed: '접수마감', finished: '종료',
};
const STATUS_KIND: Record<string, 'success' | 'danger' | 'warning' | 'muted'> = {
  draft: 'muted', open: 'success', closed: 'warning', finished: 'muted',
};

export default async function CompetitionsPage() {
  const comps = db.select().from(competitions).orderBy(desc(competitions.id)).all();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-2 text-sm">
        <Link href="/admin/users" className="rounded-lg border border-border px-3 py-1.5 hover:bg-cream">사용자 관리</Link>
        <Link href="/admin/password-resets" className="rounded-lg border border-border px-3 py-1.5 hover:bg-cream">비밀번호 요청</Link>
      </nav>
      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">대회 목록</h2>
        {comps.length === 0 ? (
          <EmptyState>아직 대회가 없습니다. 아래에서 새 대회를 만드세요.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {comps.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/competitions/${c.id}`}>
                  <Card className="transition hover:bg-cream">
                    <CardBody className="flex items-center justify-between">
                      <span className="font-bold text-ink">{c.name}</span>
                      <span className="flex items-center gap-2 text-sm text-muted">
                        /{c.slug}
                        <StatusPill kind={STATUS_KIND[c.status]}>{STATUS_LABEL[c.status]}</StatusPill>
                      </span>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">새 대회 만들기</h2>
        <NewCompetitionForm />
      </section>
    </div>
  );
}
