CREATE TABLE `competitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`notice` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`entry_fee_pre` integer DEFAULT 0 NOT NULL,
	`entry_fee_onsite` integer DEFAULT 0 NOT NULL,
	`prize_rate` real DEFAULT 0.35 NOT NULL,
	`bib_leader_start` integer DEFAULT 100 NOT NULL,
	`bib_follower_start` integer DEFAULT 500 NOT NULL,
	`bib_solo_start` integer DEFAULT 900 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `competitions_slug_unique` ON `competitions` (`slug`);--> statement-breakpoint
CREATE TABLE `divisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`competition_id` integer NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`event_date` text DEFAULT '' NOT NULL,
	`venue` text DEFAULT '' NOT NULL,
	`fee_pre` integer DEFAULT 0 NOT NULL,
	`fee_onsite` integer DEFAULT 0 NOT NULL,
	`strictly_payment` text DEFAULT 'split' NOT NULL,
	`finals_spots` integer DEFAULT 5 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`registration_id` integer NOT NULL,
	`division_id` integer NOT NULL,
	`role` text NOT NULL,
	`partner_nickname` text,
	`is_strictly_payer` integer DEFAULT true NOT NULL,
	`is_onsite_addition` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`competition_id` integer NOT NULL,
	`is_onsite` integer DEFAULT false NOT NULL,
	`depositor_name` text DEFAULT '' NOT NULL,
	`wants_judge_comment` integer DEFAULT false NOT NULL,
	`feedback_email` text DEFAULT '' NOT NULL,
	`inquiry` text DEFAULT '' NOT NULL,
	`amount_expected` integer DEFAULT 0 NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`bib_number` integer,
	`checked_in_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_reg_user_comp` ON `registrations` (`user_id`,`competition_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_reg_comp_bib` ON `registrations` (`competition_id`,`bib_number`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`nickname` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'participant' NOT NULL,
	`swing_start_date` text,
	`team` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);