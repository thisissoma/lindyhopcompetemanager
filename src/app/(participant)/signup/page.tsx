'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/ui/app-shell';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const [f, setF] = useState({
    nickname: '', phone: '', password: '', email: '', name: '',
    swingStartDate: '', team: '',
  });
  const [error, setError] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
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
              <h1 className="text-center text-xl font-extrabold text-primary">참가자 가입</h1>
              <p className="mb-1 text-center text-xs text-muted">휴대폰번호가 로그인 아이디로 사용됩니다.</p>
              <Field label="닉네임" required>
                <Input value={f.nickname} onChange={set('nickname')} />
              </Field>
              <Field label="휴대폰 번호" required>
                <Input inputMode="numeric" placeholder="01011112222" value={f.phone} onChange={set('phone')} />
              </Field>
              <Field label="비밀번호(8자 이상)" required>
                <Input type="password" value={f.password} onChange={set('password')} />
              </Field>
              <Field label="이메일" optional>
                <Input type="email" placeholder="저지 코멘트를 받으시려면 입력해주세요" value={f.email} onChange={set('email')} />
              </Field>
              <Field label="실명(입금자 확인을 위해 필요합니다)" required>
                <Input value={f.name} onChange={set('name')} />
              </Field>
              <Field label="스윙 시작 시기 (예: 2024-06-28)" optional>
                <Input value={f.swingStartDate} onChange={set('swingStartDate')} />
              </Field>
              <Field label="소속 동호회/팀" optional>
                <Input value={f.team} onChange={set('team')} />
              </Field>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full">가입하기</Button>
              <p className="text-center text-sm text-muted">
                이미 계정이 있으신가요? <Link href="/login" className="font-semibold text-primary underline">로그인</Link>
              </p>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
