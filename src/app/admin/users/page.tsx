import Link from 'next/link';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { currentUser } from '@/lib/auth-server';
import UsersTable from './users-table';
import CreateOperatorForm from './create-operator-form';

export default async function UsersPage() {
  const me = await currentUser();
  const canManage = me?.role === 'organizer';
  const rows = db.select().from(users).orderBy(desc(users.id)).all()
    .map((u) => ({ id: u.id, name: u.name, nickname: u.nickname, phone: u.phone, role: u.role }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">사용자 관리</h2>
        <Link href="/admin/competitions" className="text-sm underline">대회 목록</Link>
      </div>
      <p className="text-sm text-muted">역할 변경·운영진 계정 생성은 오거나이저만 가능합니다.</p>
      {canManage && <CreateOperatorForm />}
      <UsersTable rows={rows} canManage={canManage} />
    </div>
  );
}
