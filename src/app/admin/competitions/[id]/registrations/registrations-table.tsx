'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { StatusPill } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { Tag } from '@/components/ui/tag';

export type RegRow = {
  id: number; name: string; nickname: string; phone: string; depositorName: string;
  entries: { divisionId: number; divisionName: string; role: string; isOnsiteAddition: boolean }[];
  amountExpected: number; amountPaid: number; paymentStatus: string; status: string; bibNumber: number | null;
  isOnsite: boolean;
};

// 현장 관련 등록: 현장 신규등록(isOnsite)이거나 현장에서 부문을 추가한 경우
function isOnsiteReg(r: RegRow): boolean {
  return r.isOnsite || r.entries.some((e) => e.isOnsiteAddition);
}

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: '입금대기', paid: '입금완료', mismatch: '금액불일치', refund_pending: '환불대기', refunded: '환불완료',
};
const PILL: Record<string, 'success' | 'danger' | 'warning' | 'muted'> = {
  unpaid: 'warning', paid: 'success', mismatch: 'danger', refund_pending: 'warning', refunded: 'danger',
};
const ROLE_LABEL: Record<string, string> = { leader: '리더', follower: '팔뤄', solo: '솔로' };

// 저장된 상태가 paid여도 실제 입금액이 예상액과 다르면 불일치로 취급(부문 추가/철회로 차액 발생 등).
function isMismatch(r: RegRow): boolean {
  if (r.status === 'cancelled') return false;
  return r.paymentStatus === 'mismatch' || (r.paymentStatus === 'paid' && r.amountPaid !== r.amountExpected);
}

// 불일치일 때 방향에 따라 추가입금/환불 안내
function payLabel(r: RegRow): string {
  if (isMismatch(r)) return r.amountPaid < r.amountExpected ? '추가입금필요' : '과입금·환불필요';
  return PAYMENT_LABEL[r.paymentStatus];
}

const FILTERS = [
  { v: 'all', l: '전체' }, { v: 'unpaid', l: '입금대기' },
  { v: 'mismatch', l: '금액불일치' }, { v: 'refund_pending', l: '환불대기' },
  { v: 'onsite', l: '현장' },
];

function matchesPayFilter(r: RegRow, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'mismatch') return isMismatch(r);
  if (filter === 'onsite') return isOnsiteReg(r);
  return r.paymentStatus === filter;
}

function PaymentAction({ row }: { row: RegRow }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(row.amountExpected));
  const [busy, setBusy] = useState(false);

  async function call(body: unknown) {
    setBusy(true);
    const res = await fetch(`/api/admin/registrations/${row.id}/payment`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert((await res.json()).error ?? '처리 실패');
  }

  if (row.paymentStatus === 'refund_pending') {
    return <Button size="sm" variant="danger" disabled={busy} onClick={() => call({ action: 'refund' })}>환불완료</Button>;
  }
  // 정상 완료(paid·confirmed·금액일치)만 처리 없음. 불일치면 재확인 인풋 노출.
  if (row.paymentStatus === 'refunded' || (row.paymentStatus === 'paid' && row.status === 'confirmed' && !isMismatch(row))) {
    return <span className="text-xs text-muted">—</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      <Input className="w-full" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Button size="sm" disabled={busy} onClick={() => call({ action: 'confirm', amountPaid: Number(amount) })}>입금확인</Button>
    </div>
  );
}

function BibAction({ row }: { row: RegRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function call(body: unknown) {
    setBusy(true);
    const res = await fetch(`/api/admin/registrations/${row.id}/bib`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert((await res.json()).error ?? '처리 실패');
  }
  if (row.bibNumber != null) {
    return (
      <button
        disabled={busy}
        onClick={() => { const v = prompt('번호 수동 변경', String(row.bibNumber)); if (v) call({ bibNumber: Number(v) }); }}
        className="rounded-lg bg-primary px-2 py-0.5 text-xs font-extrabold text-white"
      >{row.bibNumber}</button>
    );
  }
  if (row.status !== 'confirmed') return <span className="text-xs text-muted">—</span>;
  return <Button size="sm" variant="ghost" disabled={busy} onClick={() => call({ action: 'assign' })}>번호부여</Button>;
}

export default function RegistrationsTable({ rows, competitionId, divisions }: { rows: RegRow[]; competitionId: number; divisions: { id: number; name: string }[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [divFilter, setDivFilter] = useState('0'); // '0' = 전체 부문
  const [busy, setBusy] = useState(false);
  const shown = rows
    .filter((r) =>
      matchesPayFilter(r, filter) &&
      (divFilter === '0' || r.entries.some((e) => String(e.divisionId) === divFilter)),
    )
    .sort((a, b) => {
      // 번호순(오름차순), 번호 미부여는 맨 뒤
      if (a.bibNumber == null && b.bibNumber == null) return 0;
      if (a.bibNumber == null) return 1;
      if (b.bibNumber == null) return -1;
      return a.bibNumber - b.bibNumber;
    });

  async function assignAll() {
    setBusy(true);
    const res = await fetch(`/api/admin/competitions/${competitionId}/bibs`, { method: 'POST' });
    setBusy(false);
    if (res.ok) { const { assigned } = await res.json(); alert(`${assigned}명에게 번호를 부여했습니다`); router.refresh(); }
    else alert((await res.json()).error ?? '처리 실패');
  }

  const payTabs = FILTERS.map((f) => ({
    value: f.v, label: f.l,
    count: f.v === 'all' ? rows.length : rows.filter((r) => matchesPayFilter(r, f.v)).length,
  }));
  const divTabs = [
    { value: '0', label: '전체', count: rows.length },
    ...divisions.map((d) => ({ value: String(d.id), label: d.name, count: rows.filter((r) => r.entries.some((e) => e.divisionId === d.id)).length })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterTabs tabs={payTabs} value={filter} onChange={setFilter} />
        <div className="ml-auto flex gap-2">
          <Link href={`/admin/competitions/${competitionId}/onsite`}><Button variant="secondary" size="sm">＋ 현장 신규등록</Button></Link>
          <Button variant="ghost" size="sm" disabled={busy} onClick={assignAll}>번호 일괄부여</Button>
        </div>
      </div>
      <p className="text-xs text-muted">닉네임을 클릭하면 부문 추가/철회·입금·번호를 편집할 수 있습니다.</p>

      {divisions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">부문:</span>
          <FilterTabs tabs={divTabs} value={divFilter} onChange={setDivFilter} />
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted">해당하는 신청자가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="p-2">번호</th><th className="p-2">참가자</th><th className="p-2 min-w-[80px]">입금자명</th>
                <th className="p-2">부문</th><th className="p-2">예상/입금</th><th className="p-2 min-w-[80px]">상태</th><th className="p-2 w-[120px]">처리</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={`border-b border-border ${r.status === 'cancelled' ? 'opacity-60' : ''}`}>
                  <td className="p-2"><BibAction row={r} /></td>
                  <td className="p-2">
                    <Link href={`/admin/competitions/${competitionId}/registrations/${r.id}`} className="font-semibold text-primary underline">{r.nickname}</Link>
                    {r.isOnsite && <span className="ml-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">현장등록</span>}
                    <span className="block text-xs text-muted">{r.name} · {r.phone}</span>
                  </td>
                  <td className="p-2 text-ink">{r.depositorName || '—'}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {r.entries.map((e, i) => e.isOnsiteAddition ? (
                        <span key={i} className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
                          {e.divisionName} {ROLE_LABEL[e.role]} · 현장
                        </span>
                      ) : (
                        <Tag key={i}>{e.divisionName} {ROLE_LABEL[e.role]}</Tag>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-2 text-ink">
                    {r.amountExpected.toLocaleString()}
                    <span className={r.amountPaid && r.amountPaid !== r.amountExpected ? 'text-danger' : 'text-muted'}>
                      {' / '}{r.amountPaid.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-0.5">
                      <StatusPill kind={r.status === 'cancelled' ? 'muted' : isMismatch(r) ? 'danger' : (PILL[r.paymentStatus] ?? 'muted')}>{payLabel(r)}</StatusPill>
                      {r.status === 'cancelled' && <span className="text-xs text-muted">취소됨</span>}
                    </div>
                  </td>
                  <td className="p-2">{r.status === 'cancelled' && r.paymentStatus !== 'refund_pending' ? <span className="text-xs text-muted">—</span> : <PaymentAction row={r} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
