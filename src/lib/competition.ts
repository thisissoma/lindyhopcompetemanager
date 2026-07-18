import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { competitions, divisions } from '@/db/schema';

export const competitionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  notice: z.string().default(''),
  logoUrl: z.string().default(''),
  collectsJudgeComment: z.boolean().default(false),
  status: z.enum(['draft', 'open', 'closed', 'finished']).optional(),
  entryFeePre: z.number().int().nonnegative().default(0),
  entryFeeOnsite: z.number().int().nonnegative().default(0),
  prizeRate: z.number().min(0).max(1).default(0.35),
  bibLeaderStart: z.number().int().default(100),
  bibFollowerStart: z.number().int().default(500),
  bibSoloStart: z.number().int().default(900),
});

export const divisionSchema = z.object({
  competitionId: z.number().int(),
  name: z.string().min(1),
  kind: z.enum(['mnm', 'strictly', 'solo', 'team']),
  description: z.string().default(''),
  eventDate: z.string().default(''), // YYYY-MM-DD (다일 대회용)
  venue: z.string().default(''),     // 장소 (다장소 대회용)
  feePre: z.number().int().nonnegative().default(0),
  feeOnsite: z.number().int().nonnegative().default(0),
  strictlyPayment: z.enum(['single', 'split']).default('split'),
  finalsSpots: z.number().int().positive().default(5),
  sortOrder: z.number().int().default(0),
});

export function createCompetition(db: any, input: unknown) {
  const data = competitionSchema.parse(input);
  if (db.select().from(competitions).where(eq(competitions.slug, data.slug)).get())
    throw new Error('DUPLICATE_SLUG');
  const [c] = db.insert(competitions).values(data).returning().all();
  return c;
}

export function updateCompetition(db: any, id: number, patch: unknown) {
  const data = competitionSchema.partial().parse(patch);
  const [c] = db.update(competitions).set(data).where(eq(competitions.id, id)).returning().all();
  return c;
}

export function createDivision(db: any, input: unknown) {
  const data = divisionSchema.parse(input);
  const [d] = db.insert(divisions).values(data).returning().all();
  return d;
}

export function updateDivision(db: any, id: number, patch: unknown) {
  const data = divisionSchema.partial().parse(patch);
  const [d] = db.update(divisions).set(data).where(eq(divisions.id, id)).returning().all();
  return d;
}
