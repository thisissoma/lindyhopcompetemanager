'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { BibChip } from '@/components/ui/bib-chip';
import { StatusPill } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { Select, Input } from '@/components/ui/field';

type EntryRow = { id: number; divisionName: string; role: string; partnerNickname: string; isOnsiteAddition: boolean };
type Div = { id: number; name: string; kind: string };

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: '입금대기', paid: '입금완료', mismatch: '금액불일치', refund_pending: '환불대기', refunded: '환불완료',
};
const PILL: Record<string, 'success' | 'danger' | 'warning'> = {
  unpaid: 'warning', paid: 'success', mismatch: 'danger', refund_pending: 'warning', refunded: 'danger',
};
const STATUS_LABEL: Record<string, string> = { pending: '확인대기', confirmed: '확정', cancelled: '취소됨' };
const ROLE_LABEL: Record<string, string> = { leader: '리더', follower: '팔뤄', solo: '솔로' };

export default function RegistrationCard(props: {
  competitionId: number; competitionName: string; status: string; paymentStatus: string;
  amountExpected: number; amountPaid: number; bibNumber: number | null;
  entries: EntryRow[]; availableDivisions: Div[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [addId, setAddId] = useState('');
  const [addRole, setAddRole] = useState<'leader' | 'follower' | 'solo'>('leader');
  const [addPartner, setAddPartner] = useState('');
  const cancelled = props.status === 'cancelled';

  async function call(method: string, body?: unknown) {
    setBusy(true); setError('');
    const res = await fetch(`/api/competitions/${props.competitionId}/register`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError((await res.json()).error ?? '처리 실패');
  }

  const addDiv = props.availableDivisions.find((d) => d.id === Number(addId));
  const pillKind = cancelled ? 'muted' : PILL[props.paymentStatus];

  return (
    <Card className={cancelled ? 'opacity-60' : ''}>
      <CardBody>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">{props.competitionName}</h2>
          <BibChip number={props.bibNumber} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <StatusPill kind={pillKind}>{cancelled ? STATUS_LABEL.cancelled : PAYMENT_LABEL[props.paymentStatus]}</StatusPill>
          <span>
            {!cancelled && `${STATUS_LABEL[props.status]} · `}
            예상 {props.amountExpected.toLocaleString()}원
            {props.amountPaid > 0 && ` · 입금 ${props.amountPaid.toLocaleString()}원`}
          </span>
        </div>

        <ul className="mt-3 flex flex-col gap-[10px] text-sm">
          {props.entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-lg bg-cream px-2.5 py-1.5">
              <span className="text-ink">
                {e.divisionName} · {ROLE_LABEL[e.role]}
                {e.partnerNickname && ` (파트너: ${e.partnerNickname})`}
                {e.isOnsiteAddition && <span className="ml-1 text-xs text-accent">현장추가</span>}
              </span>
              {!cancelled && props.entries.length > 1 && (
                <Button variant="danger" size="sm" disabled={busy} onClick={() => call('PUT', { cancelEntryIds: [e.id] })}>
                  부문취소
                </Button>
              )}
            </li>
          ))}
        </ul>

        {!cancelled && props.availableDivisions.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-border p-2.5 text-sm">
            <Select value={addId} onChange={(e) => { setAddId(e.target.value); setAddRole('leader'); }}>
              <option value="">부문 추가…</option>
              {props.availableDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            {addDiv && addDiv.kind !== 'solo' && (
              <Select value={addRole} onChange={(e) => setAddRole(e.target.value as any)}>
                <option value="leader">리더</option>
                <option value="follower">팔뤄</option>
              </Select>
            )}
            {addDiv && addDiv.kind === 'strictly' && (
              <Input placeholder="파트너 닉네임" value={addPartner} onChange={(e) => setAddPartner(e.target.value)} />
            )}
            {addDiv && (
              <Button
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => call('PUT', { add: [{ divisionId: addDiv.id, role: addDiv.kind === 'solo' ? 'solo' : addRole, partnerNickname: addPartner || undefined }] })}
              >
                추가
              </Button>
            )}
          </div>
        )}

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {!cancelled && (
          <div className="mt-3 flex gap-3 text-sm">
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => { if (confirm('이 대회 신청을 전체 취소하시겠어요?')) call('DELETE'); }}
            >
              신청 전체 취소
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
