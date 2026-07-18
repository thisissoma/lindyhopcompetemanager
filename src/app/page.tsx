import Link from 'next/link';
import { db } from '@/db';
import { competitions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { currentUser } from '@/lib/auth-server';
import { AppShell } from '@/components/ui/app-shell';
import { LogoBanner } from '@/components/ui/logo-banner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

export default async function Home() {
  const user = await currentUser();
  const openComps = db.select().from(competitions).where(eq(competitions.status, 'open')).orderBy(desc(competitions.id)).all();

  return (
    <AppShell>
      <LogoBanner title="스트릿린디파이터" />

      {user ? (
        <p className="mb-3 text-center text-sm text-ink">
          <span className="font-bold text-primary">{user.nickname}</span>님 환영합니다.
        </p>
      ) : (
        <div className="mb-4 flex gap-2">
          <Link href="/login" className="flex-1"><Button className="w-full">로그인</Button></Link>
          <Link href="/signup" className="flex-1"><Button variant="ghost" className="w-full">가입하기</Button></Link>
        </div>
      )}

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-bold text-primary">접수중인 대회</h2>
        {openComps.length === 0 ? (
          <p className="text-sm text-muted">현재 접수중인 대회가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {openComps.map((c) => (
              <Link key={c.id} href={`/c/${c.slug}`}>
                <Card accent className="transition hover:bg-cream">
                  <CardBody className="flex items-center justify-between">
                    <span className="font-bold text-ink">{c.name}</span>
                    <span className="text-sm font-semibold text-accent">참가 신청 →</span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {user && (
        <div className="flex flex-col gap-2">
          <Link href="/my"><Button variant="secondary" className="w-full">내 신청 내역</Button></Link>
          {(user.role === 'staff' || user.role === 'organizer') && (
            <>
              <Link href="/admin/competitions"><Button variant="ghost" className="w-full">대회 관리</Button></Link>
              <Link href="/admin/users"><Button variant="ghost" className="w-full">사용자 관리</Button></Link>
              <Link href="/admin/password-resets"><Button variant="ghost" className="w-full">비밀번호 요청</Button></Link>
            </>
          )}
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="ghost" className="w-full text-muted">로그아웃</Button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
