import { inArray } from 'drizzle-orm';
import { divisions } from '@/db/schema';

type EntryLike = { divisionId: number; partnerNickname?: string; teamName?: string };

// 부문이 이 대회 소속인지 + strictly 부문이면 파트너 닉네임 필수.
// 문제가 있으면 에러 메시지(한국어), 없으면 null. 모든 등록 경로에서 공통으로 쓴다.
export function validateCompetitionEntries(db: any, competitionId: number, entries: EntryLike[]): string | null {
  if (entries.length === 0) return null;
  const divs = db.select().from(divisions).where(inArray(divisions.id, entries.map((e) => e.divisionId))).all();
  for (const e of entries) {
    const d = divs.find((x: any) => x.id === e.divisionId);
    if (!d || d.competitionId !== competitionId) return '잘못된 부문입니다';
    if (d.kind === 'strictly' && !e.partnerNickname?.trim()) return 'Strictly 부문은 파트너 닉네임이 필요합니다';
    if (d.kind === 'team' && !e.teamName?.trim()) return '듀오/트리오 부문은 팀명이 필요합니다';
  }
  return null;
}
