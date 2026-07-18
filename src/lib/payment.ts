import { eq } from 'drizzle-orm';
import { registrations } from '@/db/schema';

export function confirmPayment(db: any, registrationId: number, amountPaid: number) {
  const reg = db.select().from(registrations).where(eq(registrations.id, registrationId)).get();
  if (!reg) throw new Error('신청 내역이 없습니다');
  const matched = amountPaid === reg.amountExpected;
  const [updated] = db.update(registrations).set({
    amountPaid,
    paymentStatus: matched ? 'paid' : 'mismatch',
    status: matched ? 'confirmed' : reg.status,
  }).where(eq(registrations.id, registrationId)).returning().all();
  return updated;
}

export function markRefunded(db: any, registrationId: number) {
  const [updated] = db.update(registrations).set({ paymentStatus: 'refunded' })
    .where(eq(registrations.id, registrationId)).returning().all();
  return updated;
}
