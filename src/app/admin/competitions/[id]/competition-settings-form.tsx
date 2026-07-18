'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Comp = {
  id: number; slug: string; name: string; notice: string; status: string;
  entryFeePre: number; entryFeeOnsite: number; prizeRate: number;
  bibLeaderStart: number; bibFollowerStart: number; bibSoloStart: number;
  logoUrl: string;
  collectsJudgeComment: boolean;
};

const STATUSES = [
  { v: 'draft', l: '준비중' }, { v: 'open', l: '접수중' },
  { v: 'closed', l: '접수마감' }, { v: 'finished', l: '종료' },
];

export default function CompetitionSettingsForm({ comp }: { comp: Comp }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: comp.name, notice: comp.notice, status: comp.status,
    entryFeePre: String(comp.entryFeePre), entryFeeOnsite: String(comp.entryFeeOnsite),
    prizeRate: String(comp.prizeRate),
    bibLeaderStart: String(comp.bibLeaderStart), bibFollowerStart: String(comp.bibFollowerStart), bibSoloStart: String(comp.bibSoloStart),
    logoUrl: comp.logoUrl,
    collectsJudgeComment: comp.collectsJudgeComment,
  });
  const [msg, setMsg] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const res = await fetch(`/api/admin/competitions/${comp.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: f.name, notice: f.notice, status: f.status,
        entryFeePre: Number(f.entryFeePre), entryFeeOnsite: Number(f.entryFeeOnsite),
        prizeRate: Number(f.prizeRate),
        bibLeaderStart: Number(f.bibLeaderStart), bibFollowerStart: Number(f.bibFollowerStart), bibSoloStart: Number(f.bibSoloStart),
        logoUrl: f.logoUrl,
        collectsJudgeComment: f.collectsJudgeComment,
      }),
    });
    if (res.ok) { setMsg('저장됨'); router.refresh(); }
    else setMsg((await res.json()).error ?? '저장 실패');
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="대회 이름">
                <Input value={f.name} onChange={set('name')} />
              </Field>
            </div>
            <div className="w-32">
              <Field label="상태">
                <Select value={f.status} onChange={set('status')}>
                  {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </Select>
              </Field>
            </div>
          </div>
          <Field label="로고 이미지 URL">
            <Input placeholder="https://..." value={f.logoUrl} onChange={set('logoUrl')} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={f.collectsJudgeComment}
              onChange={(e) => setF((p) => ({ ...p, collectsJudgeComment: e.target.checked }))}
            />
            저지 코멘트 수집 (참가자에게 코멘트 받을 이메일을 신청 시 입력받음)
          </label>
          <Field label="공지/안내문 (마크다운)">
            <Textarea rows={4} value={f.notice} onChange={set('notice')} />
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
            <div className="flex-1">
              <Field label="상금 비율 (0~1)">
                <Input type="number" step="0.01" value={f.prizeRate} onChange={set('prizeRate')} />
              </Field>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="리더 번호 시작">
                <Input type="number" value={f.bibLeaderStart} onChange={set('bibLeaderStart')} />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="팔뤄 번호 시작">
                <Input type="number" value={f.bibFollowerStart} onChange={set('bibFollowerStart')} />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="솔로 번호 시작">
                <Input type="number" value={f.bibSoloStart} onChange={set('bibSoloStart')} />
              </Field>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">설정 저장</Button>
            {msg && <span className="text-sm text-muted">{msg}</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
