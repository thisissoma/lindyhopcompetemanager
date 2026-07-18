'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/field';

type Row = { id: number; name: string; nickname: string; phone: string; role: string };
const ROLES = [
  { v: 'participant', l: '참가자' }, { v: 'staff', l: '스태프' }, { v: 'organizer', l: '오거나이저' },
];

export default function UsersTable({ rows, canManage = true }: { rows: Row[]; canManage?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  async function change(id: number, role: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert((await res.json()).error ?? '역할 변경 실패');
  }

  const s = q.trim();
  const match = (r: Row) => !s || r.nickname.includes(s) || r.name.includes(s) || r.phone.includes(s);
  const byNickname = (a: Row, b: Row) => a.nickname.localeCompare(b.nickname, 'ko');
  const operators = rows.filter((r) => r.role !== 'participant' && match(r)).sort(byNickname);
  const participants = rows.filter((r) => r.role === 'participant' && match(r)).sort(byNickname);

  const table = (list: Row[]) =>
    list.length === 0 ? (
      <p className="p-2 text-sm text-muted">해당 없음</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-2">닉네임</th><th className="p-2">이름</th><th className="p-2">전화</th><th className="p-2">역할</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="p-2 font-medium text-ink">{r.nickname}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.phone}</td>
                <td className="p-2">
                  <Select className="w-28" value={r.role} disabled={busy || !canManage} onChange={(e) => change(r.id, e.target.value)}>
                    {ROLES.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <input
        className="w-full rounded-lg border border-border bg-surface p-2 text-sm text-ink outline-none focus:border-accent"
        placeholder="닉네임 / 이름 / 전화 검색" value={q} onChange={(e) => setQ(e.target.value)}
      />
      <details open className="rounded-lg border border-border">
        <summary className="cursor-pointer p-2 text-sm font-bold text-primary">운영진 (스태프·오거나이저) · {operators.length}명</summary>
        <div className="border-t border-border p-1">{table(operators)}</div>
      </details>
      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer p-2 text-sm font-bold text-primary">참가자 · {participants.length}명</summary>
        <div className="border-t border-border p-1">{table(participants)}</div>
      </details>
    </div>
  );
}
