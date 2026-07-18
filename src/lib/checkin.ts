import { eq } from 'drizzle-orm';
import { registrations } from '@/db/schema';

export function checkIn(db: any, registrationId: number) {
  const reg = db.select().from(registrations).where(eq(registrations.id, registrationId)).get();
  if (!reg) throw new Error('신청 내역이 없습니다');
  if (reg.status !== 'confirmed') throw new Error('입금 확인된 참가자만 체크인할 수 있습니다');
  const [updated] = db.update(registrations).set({ checkedInAt: new Date().toISOString() })
    .where(eq(registrations.id, registrationId)).returning().all();
  return updated;
}

export function undoCheckIn(db: any, registrationId: number) {
  const [updated] = db.update(registrations).set({ checkedInAt: null })
    .where(eq(registrations.id, registrationId)).returning().all();
  return updated;
}
