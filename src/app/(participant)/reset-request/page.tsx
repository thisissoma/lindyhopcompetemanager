'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/ui/app-shell';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export default function ResetRequestPage() {
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/password-reset/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, note }),
    });
    if (res.ok) setDone(true);
    else setError((await res.json()).error ?? '요청 실패');
  }

  return (
    <AppShell>
      <div className="mt-10 flex justify-center">
        <Card className="w-full max-w-sm">
          <CardBody>
            {done ? (
              <div className="flex flex-col gap-3 text-sm">
                <h1 className="text-xl font-extrabold text-primary">요청이 접수됐습니다</h1>
                <p className="text-ink">운영진이 확인 후 비밀번호를 초기화해 드립니다. 새 비밀번호는 <b>오픈카톡</b>으로 안내드립니다.</p>
                <Link href="/login" className="font-semibold text-primary underline">로그인으로</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <h1 className="text-center text-xl font-extrabold text-primary">비밀번호 재설정 요청</h1>
                <p className="text-center text-xs text-muted">
                  가입한 휴대폰번호로 요청을 남겨주세요. 운영진이 초기화 후 <b>오픈카톡</b>으로 새 비밀번호를 알려드립니다.
                </p>
                <Field label="휴대폰번호" required>
                  <Input inputMode="numeric" placeholder="01011112222" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <Field label="메모" optional>
                  <Textarea rows={2} placeholder="본인 확인에 도움이 될 내용(닉네임 등)" value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" className="w-full">요청 남기기</Button>
                <Link href="/login" className="text-center text-sm text-muted underline">로그인으로 돌아가기</Link>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
