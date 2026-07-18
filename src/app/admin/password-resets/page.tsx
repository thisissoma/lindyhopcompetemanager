import Link from 'next/link';
import { db } from '@/db';
import { users, passwordResetRequests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import ResetRequestsList, { type ReqRow } from './reset-requests-list';

export default async function PasswordResetsPage() {
  const reqs = db.select().from(passwordResetRequests)
    .where(eq(passwordResetRequests.status, 'pending'))
    .orderBy(desc(passwordResetRequests.id)).all();

  const rows: ReqRow[] = reqs.map((r) => {
    const u = db.select().from(users).where(eq(users.phone, r.phone)).get();
    return { id: r.id, phone: r.phone, note: r.note, createdAt: r.createdAt, nickname: u?.nickname ?? null };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">비밀번호 재설정 요청</h2>
        <Link href="/admin/competitions" className="text-sm underline">대회 목록</Link>
      </div>
      <p className="text-sm text-muted">초기화하면 랜덤 비밀번호가 생성됩니다. 그 값을 오픈카톡으로 참가자에게 전달하세요.</p>
      <ResetRequestsList rows={rows} />
    </div>
  );
}
