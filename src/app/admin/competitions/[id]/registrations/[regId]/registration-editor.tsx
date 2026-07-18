'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { StatusPill } from '@/components/ui/status-pill';
import { BibChip } from '@/components/ui/bib-chip';

type Entry = { id: number; divisionName: string; role: string; partnerNickname: string; isOnsiteAddition: boolean };
type Div = { id: number; name: string; kind: string; feePre: number; feeOnsite: number };

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: '입금대기', paid: '입금완료', mismatch: '금액불일치', refund_pending: '환불대기', refunded: '환불완료',
};
const PILL: Record<string, 'success' | 'danger' | 'warning' | 'muted'> = {
  unpaid: 'warning', paid: 'success', mismatch: 'danger', refund_pending: 'warning', refunded: 'danger',
};
const ROLE_LABEL: Record<string, string> = { leader: '리더', follower: '팔뤄', solo: '솔로' };

export default function RegistrationEditor(props: {
  registrationId: number; paymentStatus: string; status: string;
  amountExpected: number; amountPaid: number; bibNumber: number | null;
  depositorName: string; entries: Entry[]; available: Div[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [amount, setAmount] = useState(String(props.amountExpected));
  const [addId, setAddId] = useState('');
  const [addRole, setAddRole] = useState('leader');
  const [addPartner, setAddPartner] = useState('');
  const [onsite, setOnsite] = useState(false);
  const base = `/api/admin/registrations/${props.registrationId}`;

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true); setMsg('');
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok) { router.refresh(); return json; }
    setMsg(json.error ?? '처리 실패');
    return null;
  }

  const addDiv = props.available.find((d) => d.id === Number(addId));

  return (
    <div className="flex flex-col gap-4">
      {msg && <p className="text-sm text-danger">{msg}</p>}

      <Card>
        <CardBody className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const mismatch = props.status !== 'cancelled' &&
                (props.paymentStatus === 'mismatch' || (props.paymentStatus === 'paid' && props.amountPaid !== props.amountExpected));
              const label = props.status === 'cancelled' ? '취소됨'
                : mismatch ? (props.amountPaid < props.amountExpected ? '추가입금필요' : '과입금·환불필요')
                : PAYMENT_LABEL[props.paymentStatus];
              const kind = props.status === 'cancelled' ? 'muted' : mismatch ? 'danger' : PILL[props.paymentStatus];
              return <StatusPill kind={kind}>{label}</StatusPill>;
            })()}
            <span className="text-sm text-muted">
              예상 {props.amountExpected.toLocaleString()}원 · 입금 {props.amountPaid.toLocaleString()}원
              {props.depositorName && ` · 입금자 ${props.depositorName}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-32" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button size="sm" disabled={busy} onClick={() => call(`${base}/payment`, 'PATCH', { action: 'confirm', amountPaid: Number(amount) })}>입금확인</Button>
            {props.paymentStatus === 'refund_pending' && (
              <Button size="sm" variant="danger" disabled={busy} onClick={() => call(`${base}/payment`, 'PATCH', { action: 'refund' })}>환불완료</Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">참가번호</span>
          <BibChip number={props.bibNumber} />
          {props.bibNumber == null ? (
            <>
              <Button size="sm" disabled={busy || props.status !== 'confirmed'} onClick={() => call(`${base}/bib`, 'PATCH', { action: 'assign' })}>번호부여</Button>
              {props.status !== 'confirmed' && <span className="text-xs text-muted">입금확인 후 부여 가능</span>}
            </>
          ) : (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => { const v = prompt('번호 수동 변경', String(props.bibNumber)); if (v) call(`${base}/bib`, 'PATCH', { bibNumber: Number(v) }); }}>수동변경</Button>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink">참가 부문</p>
          {props.entries.length === 0 ? (
            <p className="text-sm text-muted">참가 부문이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {props.entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-cream px-2.5 py-1.5">
                  <span className="text-ink">
                    {e.divisionName} · {ROLE_LABEL[e.role]}
                    {e.partnerNickname && ` (파트너: ${e.partnerNickname})`}
                    {e.isOnsiteAddition && <span className="ml-1 text-xs text-accent">현장추가</span>}
                  </span>
                  <Button size="sm" variant="danger" disabled={busy} onClick={() => { if (confirm('이 부문을 철회할까요?')) call(`${base}/entries`, 'PATCH', { entryId: e.id, action: 'cancel' }); }}>철회</Button>
                </li>
              ))}
            </ul>
          )}

          {props.available.length > 0 && props.status !== 'cancelled' && (
            <div className="mt-1 flex flex-col gap-2 rounded-lg border border-dashed border-border p-2.5">
              <p className="text-xs font-bold text-muted">부문 추가</p>
              <Select value={addId} onChange={(e) => { setAddId(e.target.value); setAddRole('leader'); }}>
                <option value="">부문 선택…</option>
                {props.available.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              {addDiv && addDiv.kind !== 'solo' && (
                <Select value={addRole} onChange={(e) => setAddRole(e.target.value)}>
                  <option value="leader">리더</option>
                  <option value="follower">팔뤄</option>
                </Select>
              )}
              {addDiv && addDiv.kind === 'strictly' && (
                <Input placeholder="파트너 닉네임" value={addPartner} onChange={(e) => setAddPartner(e.target.value)} />
              )}
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={onsite} onChange={(e) => setOnsite(e.target.checked)} />
                현장 추가(현장요금 적용)
                {addDiv && ` — ${(onsite ? addDiv.feeOnsite : addDiv.feePre).toLocaleString()}원`}
              </label>
              {addDiv && (
                <Button size="sm" disabled={busy} onClick={async () => {
                  const r = await call(`${base}/entries`, 'POST', {
                    entries: [{ divisionId: addDiv.id, role: addDiv.kind === 'solo' ? 'solo' : addRole, partnerNickname: addPartner || undefined }],
                    isOnsiteAddition: onsite,
                  });
                  if (r) { setAddId(''); setAddPartner(''); }
                }}>추가</Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
