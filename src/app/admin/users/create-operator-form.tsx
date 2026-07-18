'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

const empty = { name: '', nickname: '', phone: '', password: '', role: 'staff' };

export default function CreateOperatorForm() {
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    });
    if (res.ok) { const u = await res.json(); setMsg(`${u.nickname} (${u.role}) 계정 생성됨`); setF(empty); router.refresh(); }
    else setMsg((await res.json()).error ?? '생성 실패');
  }

  return (
    <Card className="border-dashed">
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink">운영진 계정 생성 (스태프/오거나이저)</p>
          <div className="flex flex-wrap gap-2">
            <div className="min-w-[120px] flex-1"><Field label="이름"><Input value={f.name} onChange={set('name')} /></Field></div>
            <div className="min-w-[120px] flex-1"><Field label="닉네임"><Input value={f.nickname} onChange={set('nickname')} /></Field></div>
            <div className="min-w-[120px] flex-1"><Field label="휴대폰"><Input inputMode="numeric" placeholder="01011112222" value={f.phone} onChange={set('phone')} /></Field></div>
            <div className="min-w-[120px] flex-1"><Field label="비밀번호(8자+)"><Input type="password" value={f.password} onChange={set('password')} /></Field></div>
            <div className="w-32"><Field label="역할"><Select value={f.role} onChange={set('role')}><option value="staff">스태프</option><option value="organizer">오거나이저</option></Select></Field></div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">계정 생성</Button>
            {msg && <span className="text-sm text-muted">{msg}</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
