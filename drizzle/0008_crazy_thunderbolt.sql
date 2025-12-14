ALTER TABLE `events` ADD `isRecurring` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `recurringPattern` varchar(50);--> statement-breakpoint
ALTER TABLE `events` ADD `recurringMonths` varchar(255);