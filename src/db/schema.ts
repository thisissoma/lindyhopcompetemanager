import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  nickname: text('nickname').notNull(),          // 중복 허용, 구분은 phone으로
  phone: text('phone').notNull().unique(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['participant', 'staff', 'organizer'] }).notNull().default('participant'),
  swingStartDate: text('swing_start_date'),      // YYYY-MM 정도의 자유 텍스트 (경력 자격 판정용)
  team: text('team'),                            // 소속팀/동호회
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable('sessions', {
  token: text('token').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),       // ISO 문자열
});

export const competitions = sqliteTable('competitions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),         // URL용: /c/[slug]
  name: text('name').notNull(),
  notice: text('notice').notNull().default(''),  // 공지/안내문 (마크다운)
  logoUrl: text('logo_url').notNull().default(''),
  collectsJudgeComment: integer('collects_judge_comment', { mode: 'boolean' }).notNull().default(false), // 이 대회가 저지 코멘트를 받는지(SLF만 true)
  status: text('status', { enum: ['draft', 'open', 'closed', 'finished'] }).notNull().default('draft'),
  entryFeePre: integer('entry_fee_pre').notNull().default(0),
  entryFeeOnsite: integer('entry_fee_onsite').notNull().default(0),
  prizeRate: real('prize_rate').notNull().default(0.35),
  bibLeaderStart: integer('bib_leader_start').notNull().default(100),
  bibFollowerStart: integer('bib_follower_start').notNull().default(500),
  bibSoloStart: integer('bib_solo_start').notNull().default(900),
});

export const divisions = sqliteTable('divisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  competitionId: integer('competition_id').notNull().references(() => competitions.id),
  name: text('name').notNull(),                  // 예: "린디합 M&M 오픈"
  kind: text('kind', { enum: ['mnm', 'strictly', 'solo', 'team'] }).notNull(),
  description: text('description').notNull().default(''),
  eventDate: text('event_date').notNull().default(''), // 개최 요일/날짜 (SLF처럼 다일 대회용) YYYY-MM-DD
  venue: text('venue').notNull().default(''),          // 개최 장소 (다장소 대회용)
  feePre: integer('fee_pre').notNull().default(0),
  feeOnsite: integer('fee_onsite').notNull().default(0),
  strictlyPayment: text('strictly_payment', { enum: ['single', 'split'] }).notNull().default('split'),
  finalsSpots: integer('finals_spots').notNull().default(5),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const registrations = sqliteTable('registrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  competitionId: integer('competition_id').notNull().references(() => competitions.id),
  isOnsite: integer('is_onsite', { mode: 'boolean' }).notNull().default(false),
  depositorName: text('depositor_name').notNull().default(''),
  wantsJudgeComment: integer('wants_judge_comment', { mode: 'boolean' }).notNull().default(false),
  feedbackEmail: text('feedback_email').notNull().default(''),
  inquiry: text('inquiry').notNull().default(''),
  amountExpected: integer('amount_expected').notNull().default(0),
  amountPaid: integer('amount_paid').notNull().default(0),
  paymentStatus: text('payment_status', { enum: ['unpaid', 'paid', 'mismatch', 'refund_pending', 'refunded'] }).notNull().default('unpaid'),
  status: text('status', { enum: ['pending', 'confirmed', 'cancelled'] }).notNull().default('pending'),
  bibNumber: integer('bib_number'),              // 대회 내 유일, 1인 1번호
  checkedInAt: text('checked_in_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  uniqueIndex('uq_reg_user_comp').on(t.userId, t.competitionId),
  uniqueIndex('uq_reg_comp_bib').on(t.competitionId, t.bibNumber),
]);

export const entries = sqliteTable('entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  registrationId: integer('registration_id').notNull().references(() => registrations.id),
  divisionId: integer('division_id').notNull().references(() => divisions.id),
  role: text('role', { enum: ['leader', 'follower', 'solo'] }).notNull(),
  partnerNickname: text('partner_nickname'),     // strictly 전용
  teamName: text('team_name').notNull().default(''), // team(듀오/트리오) 전용 팀명
  isStrictlyPayer: integer('is_strictly_payer', { mode: 'boolean' }).notNull().default(true),
  isOnsiteAddition: integer('is_onsite_addition', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['active', 'cancelled'] }).notNull().default('active'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
// 주의: (registrationId, divisionId) 유니크 인덱스는 두지 않는다 — 부문 취소(status='cancelled') 후
// 같은 부문을 다시 추가할 수 있어야 하므로. 같은 부문의 active 중복은 애플리케이션 레벨에서 막는다.

// 비밀번호 재설정 요청: 이메일 리셋이 없어 운영진이 수동 처리. 참가자가 요청을 남기면 운영진이 랜덤 초기화.
export const passwordResetRequests = sqliteTable('password_reset_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  phone: text('phone').notNull(),
  note: text('note').notNull().default(''),
  status: text('status', { enum: ['pending', 'done'] }).notNull().default('pending'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
