'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { groupDivisionsByDayVenue } from '@/lib/divisions';
import { SectionGroup } from '@/components/ui/section-group';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/tag';
import { EmptyState } from '@/components/ui/empty-state';

type Division = {
  id: number; name: string; kind: string; description: string;
  eventDate: string; venue: string; feePre: number; feeOnsite: number;
  strictlyPayment: string; finalsSpots: number; sortOrder: number;
};

const KINDS = [
  { v: 'mnm', l: 'M&M' }, { v: 'strictly', l: 'Strictly' },
  { v: 'solo', l: '솔로' }, { v: 'team', l: '팀(크루)' },
];
const kindLabel = (k: string) => KINDS.find((x) => x.v === k)?.l ?? k;

type FormState = {
  name: string; kind: string; description: string; eventDate: string; venue: string;
  feePre: string; feeOnsite: string; strictlyPayment: string; finalsSpots: string; sortOrder: string;
};
const emptyForm: FormState = {
  name: '', kind: 'mnm', description: '', eventDate: '', venue: '',
  feePre: '28000', feeOnsite: '33000', strictlyPayment: 'split', finalsSpots: '5', sortOrder: '0',
};
const toForm = (d: Division): FormState => ({
  name: d.name, kind: d.kind, description: d.description, eventDate: d.eventDate, venue: d.venue,
  feePre: String(d.feePre), feeOnsite: String(d.feeOnsite), strictlyPayment: d.strictlyPayment,
  finalsSpots: String(d.finalsSpots), sortOrder: String(d.sortOrder),
});
const toBody = (f: FormState) => ({
  name: f.name, kind: f.kind, description: f.description, eventDate: f.eventDate, venue: f.venue,
  feePre: Number(f.feePre), feeOnsite: Number(f.feeOnsite), strictlyPayment: f.strictlyPayment,
  finalsSpots: Number(f.finalsSpots), sortOrder: Number(f.sortOrder),
});

function divisionMeta(d: Division) {
  return [
    [d.eventDate, d.venue].filter(Boolean).join(' '),
    `사전 ${d.feePre.toLocaleString()}원 / 현장 ${d.feeOnsite.toLocaleString()}원`,
    d.kind === 'strictly' ? (d.strictlyPayment === 'split' ? 'Strictly 반반' : 'Strictly 한 명 전액') : '',
    `본선 ${d.finalsSpots}명`,
  ].filter(Boolean).join(' · ');
}

function DivisionFields({ f, setF }: { f: FormState; setF: React.Dispatch<React.SetStateAction<FormState>> }) {
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <>
      <div className="flex gap-2">
        <div className="flex-1"><Field label="부문 이름"><Input placeholder="예: Open M&M" value={f.name} onChange={set('name')} /></Field></div>
        <div className="w-32"><Field label="종류"><Select value={f.kind} onChange={set('kind')}>{KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}</Select></Field></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1"><Field label="개최일 (YYYY-MM-DD, 선택)"><Input placeholder="2026-07-18" value={f.eventDate} onChange={set('eventDate')} /></Field></div>
        <div className="flex-1"><Field label="장소 (선택)"><Input value={f.venue} onChange={set('venue')} /></Field></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1"><Field label="사전 참가비"><Input type="number" value={f.feePre} onChange={set('feePre')} /></Field></div>
        <div className="flex-1"><Field label="현장 참가비"><Input type="number" value={f.feeOnsite} onChange={set('feeOnsite')} /></Field></div>
        <div className="flex-1"><Field label="본선 진출 인원"><Input type="number" value={f.finalsSpots} onChange={set('finalsSpots')} /></Field></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1"><Field label="설명 (선택)"><Input value={f.description} onChange={set('description')} /></Field></div>
        <div className="w-32"><Field label="정렬 순서"><Input type="number" value={f.sortOrder} onChange={set('sortOrder')} /></Field></div>
      </div>
      {f.kind === 'strictly' && (
        <Field label="Strictly 지불 방식">
          <Select value={f.strictlyPayment} onChange={set('strictlyPayment')}>
            <option value="split">반반씩</option>
            <option value="single">한 명이 전액</option>
          </Select>
        </Field>
      )}
    </>
  );
}

export default function DivisionManager({ competitionId, divisions }: { competitionId: number; divisions: Division[] }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [ef, setEf] = useState<FormState>(emptyForm);
  const [editError, setEditError] = useState('');
  const groups = groupDivisionsByDayVenue(divisions);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/admin/competitions/${competitionId}/divisions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toBody(f)),
    });
    if (res.ok) { setF(emptyForm); router.refresh(); }
    else setError((await res.json()).error ?? '부문 추가 실패');
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    const res = await fetch(`/api/admin/divisions/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toBody(ef)),
    });
    if (res.ok) { setEditId(null); router.refresh(); }
    else setEditError((await res.json()).error ?? '부문 수정 실패');
  }

  return (
    <div className="flex flex-col gap-4">
      {divisions.length === 0 ? (
        <EmptyState>아직 부문이 없습니다.</EmptyState>
      ) : (
        groups.map((g) => (
          <SectionGroup key={g.key} label={g.label}>
            {g.items.map((d) => (
              <Card key={d.id} accent className="mb-2.5 last:mb-0">
                <CardBody>
                  {editId === d.id ? (
                    <form onSubmit={saveEdit} className="flex flex-col gap-2.5">
                      <DivisionFields f={ef} setF={setEf} />
                      {editError && <p className="text-sm text-danger">{editError}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">저장</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditId(null)}>취소</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-ink">{d.name}</span> <Tag>{kindLabel(d.kind)}</Tag>
                        <span className="mt-0.5 block text-xs text-muted">{divisionMeta(d)}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setEditId(d.id); setEf(toForm(d)); setEditError(''); }}>수정</Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </SectionGroup>
        ))
      )}

      <Card className="border-dashed">
        <CardBody>
          <form onSubmit={add} className="flex flex-col gap-2.5">
            <p className="text-sm font-bold text-ink">부문 추가</p>
            <DivisionFields f={f} setF={setF} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="self-start">부문 추가</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
