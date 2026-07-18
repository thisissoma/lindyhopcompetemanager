import { eq, and, isNotNull } from 'drizzle-orm';
import { registrations, entries, competitions } from '@/db/schema';

export function nextAvailableBib(used: number[], bandStart: number, bandEnd: number): number {
  const usedSet = new Set(used);
  for (let n = bandStart; n < bandEnd; n++) {
    if (!usedSet.has(n)) return n;
  }
  throw new Error(`번호대(${bandStart}~${bandEnd - 1})에 남은 번호가 없습니다`);
}

export function bibBandFor(
  role: 'leader' | 'follower' | 'solo',
  comp: { bibLeaderStart: number; bibFollowerStart: number; bibSoloStart: number },
): { start: number; end: number } {
  if (role === 'leader') return { start: comp.bibLeaderStart, end: comp.bibFollowerStart };
  if (role === 'follower') return { start: comp.bibFollowerStart, end: comp.bibSoloStart };
  return { start: comp.bibSoloStart, end: 10000 };
}

export function assignBib(db: any, registrationId: number) {
  const reg = db.select().from(registrations).where(eq(registrations.id, registrationId)).get();
  if (!reg) throw new Error('신청 내역이 없습니다');
  if (reg.status !== 'confirmed') throw new Error('입금 확인된 신청만 번호를 받을 수 있습니다');
  if (reg.bibNumber != null) return reg; // 1인 1번호: 이미 있으면 그대로

  const comp = db.select().from(competitions).where(eq(competitions.id, reg.competitionId)).get();
  const firstEntry = db.select().from(entries)
    .where(and(eq(entries.registrationId, registrationId), eq(entries.status, 'active'))).all()[0];
  if (!firstEntry) throw new Error('참가 부문이 없습니다');

  const band = bibBandFor(firstEntry.role, comp);
  const used = db.select({ bib: registrations.bibNumber }).from(registrations)
    .where(and(eq(registrations.competitionId, reg.competitionId), isNotNull(registrations.bibNumber)))
    .all().map((r: any) => r.bib as number);
  const bib = nextAvailableBib(used, band.start, band.end);
  const [updated] = db.update(registrations).set({ bibNumber: bib })
    .where(eq(registrations.id, registrationId)).returning().all();
  return updated;
}

// 대회의 confirmed & 번호 미부여 신청 전체에 등록순(id)으로 일괄 부여.
export function assignAllBibs(db: any, competitionId: number): number {
  const targets = db.select().from(registrations)
    .where(and(eq(registrations.competitionId, competitionId), eq(registrations.status, 'confirmed')))
    .all()
    .filter((r: any) => r.bibNumber == null)
    .sort((a: any, b: any) => a.id - b.id);
  let count = 0;
  for (const r of targets) {
    assignBib(db, r.id);
    count++;
  }
  return count;
}
