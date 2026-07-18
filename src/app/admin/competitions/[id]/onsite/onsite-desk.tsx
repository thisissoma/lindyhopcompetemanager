'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Flash } from '@/components/ui/flash';
import { StatusPill } from '@/components/ui/status-pill';
import { BibChip } from '@/components/ui/bib-chip';

type Div = { id: number; name: string; kind: string; feeOnsite: number };
type Reg = { id: number; amountExpected: number; amountPaid: number; paymentStatus: string; status: string; bibNumber: number | null };
type SearchResult = { userId: number; name: string; nickname: string; phone: string; registration: Reg | null };

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: '입금대기', paid: '입금완료', mismatch: '금액불일치', refund_pending: '환불대기', refunded: '환불완료',
};
const PILL: Record<string, 'success' | 'danger' | 'warning' | 'muted'> = {
  unpaid: 'warning', paid: 'success', mismatch: 'danger', refund_pending: 'warning', refunded: 'danger',
};

// 부문 선택기 (신규등록/부문추가 공용)
function DivisionPicker({ divisions, value, onChange }: {
  divisions: Div[]; value: Record<number, { role: string; partnerNickname: string }>;
  onChange: (v: Record<number, { role: string; partnerNickname: string }>) => void;
}) {
  function toggle(d: Div) {
    const next = { ...value };
    if (next[d.id]) delete next[d.id];
    else next[d.id] = { role: d.kind === 'solo' ? 'solo' : 'leader', partnerNickname: '' };
    onChange(next);
  }
  return (
    <div className="flex flex-col gap-1">
      {divisions.map((d) => {
        const sel = value[d.id];
        return (
          <div key={d.id} className={`rounded-lg border p-2 text-sm ${sel ? 'border-accent bg-soft' : 'border-border'}`}>
            <label className="flex items-center gap-2 text-ink">
              <input type="checkbox" checked={!!sel} onChange={() => toggle(d)} />
              {d.name}<span className="ml-auto text-muted">현장 {d.feeOnsite.toLocaleString()}원</span>
            </label>
            {sel && d.kind !== 'solo' && (
              <div className="mt-1 flex gap-3 pl-6 text-ink">
                <label className="flex items-center gap-1"><input type="radio" checked={sel.role === 'leader'} onChange={() => onChange({ ...value, [d.id]: { ...sel, role: 'leader' } })} /> 리더</label>
                <label className="flex items-center gap-1"><input type="radio" checked={sel.role === 'follower'} onChange={() => onChange({ ...value, [d.id]: { ...sel, role: 'follower' } })} /> 팔뤄</label>
              </div>
            )}
            {sel && d.kind === 'strictly' && (
              <Input className="mt-1 ml-6" placeholder="파트너 닉네임"
                value={sel.partnerNickname} onChange={(e) => onChange({ ...value, [d.id]: { ...sel, partnerNickname: e.target.value } })} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function toEntries(v: Record<number, { role: string; partnerNickname: string }>) {
  return Object.entries(v).map(([id, s]) => ({ divisionId: Number(id), role: s.role, partnerNickname: s.partnerNickname || undefined }));
}

export default function OnsiteDesk({ competitionId, divisions }: { competitionId: number; divisions: Div[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');

  const [nf, setNf] = useState({ name: '', nickname: '', phone: '' });
  const [nSel, setNSel] = useState<Record<number, { role: string; partnerNickname: string }>>({});
  const [addSel, setAddSel] = useState<Record<number, Record<number, { role: string; partnerNickname: string }>>>({});

  async function api(body: unknown) {
    setBusy(true);
    const res = await fetch('/api/admin/onsite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json };
  }

  async function search() {
    if (!query.trim()) return;
    const { ok, json } = await api({ action: 'search', competitionId, query });
    if (ok) setResults(json.results);
  }
  async function createNew() {
    const entries = toEntries(nSel);
    if (entries.length === 0) { setFlash('부문을 선택하세요'); return; }
    const { ok, json } = await api({ action: 'new', competitionId, ...nf, entries });
    if (ok) { setFlash(`신규 등록 완료 — 예상 ${json.registration.amountExpected.toLocaleString()}원. 이제 입금확인·번호발급하세요.`); setNf({ name: '', nickname: '', phone: '' }); setNSel({}); search(); }
    else setFlash(json.error ?? '실패');
  }
  async function addToReg(regId: number) {
    const entries = toEntries(addSel[regId] ?? {});
    if (entries.length === 0) return;
    const { ok, json } = await api({ action: 'add', registrationId: regId, entries });
    if (ok) { setFlash(`부문 추가 — 추가금 ${json.addedAmount.toLocaleString()}원`); setAddSel((p) => ({ ...p, [regId]: {} })); search(); }
    else setFlash(json.error ?? '실패');
  }
  async function confirmAssign(reg: Reg) {
    const { ok, json } = await api({ action: 'confirmAndAssign', registrationId: reg.id, amountPaid: reg.amountExpected });
    if (ok) { setFlash(`✅ 번호 ${json.bibNumber} 발급 완료`); search(); router.refresh(); }
    else setFlash(json.error ?? '실패');
  }

  return (
    <div className="flex flex-col gap-4">
      <Flash message={flash} />

      <div className="flex gap-2">
        <Input className="flex-1" placeholder="닉네임 / 이름 / 전화번호 검색" value={query}
          onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
        <Button disabled={busy} onClick={search}>검색</Button>
      </div>

      {results && (
        <div className="flex flex-col gap-3">
          {results.length === 0 && <p className="text-sm text-muted">검색 결과 없음. 아래에서 현장 신규등록하세요.</p>}
          {results.map((r) => (
            <Card key={r.userId}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{r.nickname} <span className="text-sm text-muted">{r.name} · {r.phone}</span></span>
                  {r.registration?.bibNumber != null && <BibChip number={r.registration.bibNumber} />}
                </div>
                {r.registration ? (
                  <div className="mt-2 text-sm">
                    <p className="flex items-center gap-2 text-muted">
                      <StatusPill kind={PILL[r.registration.paymentStatus] ?? 'muted'}>{PAYMENT_LABEL[r.registration.paymentStatus]}</StatusPill>
                      예상 {r.registration.amountExpected.toLocaleString()}원
                    </p>
                    <div className="mt-2">
                      <p className="mb-1 text-xs text-muted">현장 부문 추가</p>
                      <DivisionPicker divisions={divisions} value={addSel[r.registration.id] ?? {}} onChange={(v) => setAddSel((p) => ({ ...p, [r.registration!.id]: v }))} />
                      <Button size="sm" variant="ghost" className="mt-1" disabled={busy} onClick={() => addToReg(r.registration!.id)}>부문 추가</Button>
                    </div>
                    {r.registration.status !== 'confirmed' && (
                      <Button className="mt-2 w-full py-3" disabled={busy} onClick={() => confirmAssign(r.registration!)}>
                        입금확인 &amp; 번호발급 ({r.registration.amountExpected.toLocaleString()}원)
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted">이 대회 미신청 — 아래 신규등록 폼 사용</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-dashed">
        <CardBody className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-ink">현장 신규등록 (계정 즉석 생성, 비밀번호=전화 뒤 4자리)</h3>
          <div className="flex gap-2">
            <Input placeholder="이름" value={nf.name} onChange={(e) => setNf((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="닉네임" value={nf.nickname} onChange={(e) => setNf((p) => ({ ...p, nickname: e.target.value }))} />
            <Input inputMode="numeric" placeholder="전화번호" value={nf.phone} onChange={(e) => setNf((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <DivisionPicker divisions={divisions} value={nSel} onChange={setNSel} />
          <Button disabled={busy} onClick={createNew}>현장 신규등록</Button>
        </CardBody>
      </Card>
    </div>
  );
}
