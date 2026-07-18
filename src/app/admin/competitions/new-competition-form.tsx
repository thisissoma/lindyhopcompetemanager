'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export default function NewCompetitionForm() {
  const router = useRouter();
  const [f, setF] = useState({ slug: '', name: '', entryFeePre: '20000', entryFeeOnsite: '25000' });
  const [error, setError] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/competitions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: f.slug, name: f.name,
        entryFeePre: Number(f.entryFeePre), entryFeeOnsite: Number(f.entryFeeOnsite),
      }),
    });
    if (res.ok) { const c = await res.json(); router.push(`/admin/competitions/${c.id}`); router.refresh(); }
    else setError((await res.json()).error);
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="flex max-w-md flex-col gap-2.5">
          <Field label="slug (URL용, 영소문자·숫자·하이픈)">
            <Input placeholder="slf-2026" value={f.slug} onChange={set('slug')} />
          </Field>
          <Field label="대회 이름">
            <Input placeholder="스트릿린디파이터 2026" value={f.name} onChange={set('name')} />
          </Field>
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="입장료(사전)">
                <Input type="number" value={f.entryFeePre} onChange={set('entryFeePre')} />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="입장료(현장)">
                <Input type="number" value={f.entryFeeOnsite} onChange={set('entryFeeOnsite')} />
              </Field>
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="mt-1">대회 생성</Button>
        </form>
      </CardBody>
    </Card>
  );
}
