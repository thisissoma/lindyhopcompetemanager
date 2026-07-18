'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calcFee, FeeEntryInput } from '@/lib/fee';
import { groupDivisionsByDayVenue } from '@/lib/divisions';
import { SectionGroup } from '@/components/ui/section-group';
import { DivisionCard } from '@/components/ui/division-card';
import { FeeBreakdown } from '@/components/ui/fee-breakdown';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';

type Division = {
  id: number; name: string; kind: string; description: string;
  eventDate: string; venue: string; sortOrder: number;
  feePre: number; feeOnsite: number; strictlyPayment: string;
};
type Selection = { role: 'leader' | 'follower' | 'solo'; partnerNickname: string; teamName: string; isStrictlyPayer: boolean };

export default function RegisterForm({
  competitionId, entryFeePre, entryFeeOnsite, collectsJudgeComment, divisions,
}: { competitionId: number; entryFeePre: number; entryFeeOnsite: number; collectsJudgeComment: boolean; divisions: Division[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<number, Selection>>({});
  const [meta, setMeta] = useState({ depositorName: '', wantsJudgeComment: false, feedbackEmail: '', inquiry: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const groups = useMemo(() => groupDivisionsByDayVenue(divisions), [divisions]);

  function toggle(d: Division) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[d.id]) delete next[d.id];
      else next[d.id] = { role: d.kind === 'solo' ? 'solo' : 'leader', partnerNickname: '', teamName: '', isStrictlyPayer: true };
      return next;
    });
  }
  function update(id: number, patch: Partial<Selection>) {
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const fee = useMemo(() => {
    const feeEntries: FeeEntryInput[] = Object.entries(selected).map(([id, sel]) => {
      const d = divisions.find((x) => x.id === Number(id))!;
      return {
        divisionName: d.name, feePre: d.feePre, feeOnsite: d.feeOnsite,
        kind: d.kind as FeeEntryInput['kind'], strictlyPayment: d.strictlyPayment as 'single' | 'split',
        isStrictlyPayer: sel.isStrictlyPayer, isOnsiteAddition: false,
      };
    });
    return calcFee({ isOnsite: false, includeEntryFee: true, entryFeePre, entryFeeOnsite, entries: feeEntries });
  }, [selected, divisions, entryFeePre, entryFeeOnsite]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const entries = Object.entries(selected).map(([id, sel]) => ({
      divisionId: Number(id), role: sel.role,
      partnerNickname: sel.partnerNickname || undefined, teamName: sel.teamName || undefined, isStrictlyPayer: sel.isStrictlyPayer,
    }));
    if (entries.length === 0) { setError('부문을 하나 이상 선택해주세요'); return; }
    // strictly는 파트너 닉네임, team(듀오/트리오)은 팀명 필수
    for (const [id, sel] of Object.entries(selected)) {
      const d = divisions.find((x) => x.id === Number(id));
      if (d?.kind === 'strictly' && !sel.partnerNickname.trim()) { setError(`${d.name}: 파트너 닉네임을 입력해주세요`); return; }
      if (d?.kind === 'team' && !sel.teamName.trim()) { setError(`${d.name}: 팀명을 입력해주세요`); return; }
    }
    setSubmitting(true);
    const res = await fetch(`/api/competitions/${competitionId}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...meta, entries }),
    });
    setSubmitting(false);
    if (res.ok) router.push('/my');
    else setError((await res.json()).error ?? '신청 실패');
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {groups.map((g) => (
        <SectionGroup key={g.key} label={g.label}>
          {g.items.map((d) => {
            const sel = selected[d.id];
            return (
              <DivisionCard
                key={d.id}
                name={d.name}
                kind={d.kind}
                meta={d.description || undefined}
                fee={d.feePre}
                selected={!!sel}
                onClick={() => toggle(d)}
              >
                {(d.kind === 'mnm' || d.kind === 'strictly') && (
                  <div className="flex gap-3 text-sm">
                    {(['leader', 'follower'] as const).map((r) => (
                      <label key={r} className="flex items-center gap-1">
                        <input type="radio" name={`role-${d.id}`} checked={sel?.role === r} onChange={() => update(d.id, { role: r })} />
                        {r === 'leader' ? '리더' : '팔뤄'}
                      </label>
                    ))}
                  </div>
                )}
                {d.kind === 'strictly' && (
                  <>
                    <Input placeholder="파트너 닉네임" value={sel?.partnerNickname ?? ''} onChange={(e) => update(d.id, { partnerNickname: e.target.value })} />
                    {d.strictlyPayment === 'single' && (
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={sel?.isStrictlyPayer ?? true} onChange={(e) => update(d.id, { isStrictlyPayer: e.target.checked })} />
                        내가 참가비를 전액 입금합니다
                      </label>
                    )}
                  </>
                )}
                {d.kind === 'team' && (
                  <Input placeholder="팀명 (듀오/트리오 팀 이름)" value={sel?.teamName ?? ''} onChange={(e) => update(d.id, { teamName: e.target.value })} />
                )}
              </DivisionCard>
            );
          })}
        </SectionGroup>
      ))}

      <div className="flex flex-col gap-2 rounded-[10px] border border-border bg-surface p-3.5">
        <Field label="입금자명"><Input value={meta.depositorName} onChange={(e) => setMeta((m) => ({ ...m, depositorName: e.target.value }))} /></Field>
        {collectsJudgeComment && (
          <>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={meta.wantsJudgeComment} onChange={(e) => setMeta((m) => ({ ...m, wantsJudgeComment: e.target.checked }))} />
              저지 코멘트 받기
            </label>
            {meta.wantsJudgeComment && (
              <Field label="피드백 받을 이메일 (코멘트 받을 주소)">
                <Input inputMode="email" placeholder="you@example.com" value={meta.feedbackEmail} onChange={(e) => setMeta((m) => ({ ...m, feedbackEmail: e.target.value }))} />
              </Field>
            )}
          </>
        )}
        <Field label="문의사항 (선택)"><Textarea rows={2} value={meta.inquiry} onChange={(e) => setMeta((m) => ({ ...m, inquiry: e.target.value }))} /></Field>
      </div>

      <FeeBreakdown items={fee.items} total={fee.total} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full py-3.5">
        {submitting ? '신청 중…' : '신청하기'}
      </Button>
    </form>
  );
}
