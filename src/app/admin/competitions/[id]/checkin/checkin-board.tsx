'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { BibChip } from '@/components/ui/bib-chip';
import { EmptyState } from '@/components/ui/empty-state';

export type CheckinRow = { id: number; nickname: string; name: string; bibNumber: number | null; checkedIn: boolean };

export default function CheckinBoard({ rows }: { rows: CheckinRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const done = rows.filter((r) => r.checkedIn).length;
  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return r.nickname.toLowerCase().includes(s) || r.name.toLowerCase().includes(s) || String(r.bibNumber ?? '').includes(s);
  });

  async function toggle(r: CheckinRow) {
    setBusy(true);
    const res = await fetch(`/api/admin/registrations/${r.id}/checkin`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: r.checkedIn ? 'undo' : 'checkin' }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert((await res.json()).error ?? '처리 실패');
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardBody className="text-sm text-ink">
          체크인 <span className="font-extrabold text-primary">{done}</span> / {rows.length}명
        </CardBody>
      </Card>
      <Input placeholder="번호 / 닉네임 / 이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      {filtered.length === 0 ? (
        <EmptyState>확정된 참가자가 없습니다.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((r) => (
            <Card key={r.id} className={r.checkedIn ? 'bg-success-bg' : ''}>
              <CardBody className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <BibChip number={r.bibNumber} />
                  <span className="text-ink">{r.nickname}</span> <span className="text-sm text-muted">{r.name}</span>
                </span>
                <Button
                  variant={r.checkedIn ? 'ghost' : 'primary'}
                  disabled={busy}
                  onClick={() => toggle(r)}
                >
                  {r.checkedIn ? '체크인 취소' : '체크인'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
