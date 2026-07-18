'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export type ReqRow = { id: number; phone: string; note: string; createdAt: string; nickname: string | null };

export default function ResetRequestsList({ rows }: { rows: ReqRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<number, string>>({}); // id → 새 비밀번호

  async function act(id: number, action: 'reset' | 'dismiss') {
    setBusy(true);
    const res = await fetch(`/api/admin/password-resets/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { alert(json.error ?? '처리 실패'); return; }
    if (action === 'reset' && json.newPassword) setResult((p) => ({ ...p, [id]: json.newPassword }));
    else router.refresh();
  }

  if (rows.length === 0) return <EmptyState>대기중인 요청이 없습니다.</EmptyState>;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <Card key={r.id}>
          <CardBody className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">
                {r.nickname ?? '(계정 없음)'} <span className="text-sm text-muted">{r.phone}</span>
              </span>
              <span className="text-xs text-muted">{r.createdAt}</span>
            </div>
            {r.note && <p className="text-sm text-muted">메모: {r.note}</p>}
            {result[r.id] ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-success-bg p-2 text-sm">
                <span>새 비밀번호: <b className="font-mono text-base">{result[r.id]}</b> — 오픈카톡으로 전달하세요</span>
                <Button size="sm" variant="ghost" onClick={() => router.refresh()}>완료</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" disabled={busy || !r.nickname} onClick={() => act(r.id, 'reset')}>비밀번호 초기화</Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(r.id, 'dismiss')}>요청 삭제</Button>
              </div>
            )}
            {!r.nickname && <p className="text-xs text-danger">이 번호로 가입된 계정이 없습니다.</p>}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
