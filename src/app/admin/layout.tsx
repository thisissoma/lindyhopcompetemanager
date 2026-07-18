import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth-server';
import { AppShell } from '@/components/ui/app-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user || (user.role !== 'staff' && user.role !== 'organizer')) redirect('/login');

  return (
    <AppShell variant="wide">
      <header className="mb-6 flex items-center justify-between rounded-[14px] bg-primary px-5 py-4 text-white">
        <Link href="/admin/competitions" className="text-lg font-extrabold">운영진 관리</Link>
        <div className="flex items-center gap-3 text-sm text-white/85">
          <span>{user.nickname} ({user.role})</span>
          <Link href="/" className="underline">홈</Link>
        </div>
      </header>
      {children}
    </AppShell>
  );
}
