'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/ui/app-shell';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (res.ok) router.push('/');
    else setError((await res.json()).error);
  }

  return (
    <AppShell>
      <div className="mt-10 flex justify-center">
        <Card className="w-full max-w-sm">
          <CardBody>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <h1 className="text-center text-xl font-extrabold text-primary">로그인</h1>
              <p className="mb-1 text-center text-xs text-muted">가입할 때 쓴 휴대폰번호로 로그인합니다.</p>
              <Field label="휴대폰 번호">
                <Input inputMode="numeric" placeholder="01011112222" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="비밀번호">
                <Input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full">로그인</Button>
              <Link href="/reset-request" className="text-center text-xs text-muted underline">비밀번호를 잊으셨나요?</Link>
              <p className="text-center text-sm text-muted">
                계정이 없으신가요? <Link href="/signup" className="font-semibold text-primary underline">가입하기</Link>
              </p>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
