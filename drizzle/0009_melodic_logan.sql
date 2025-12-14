ALTER TABLE `events` ADD `startTime` varchar(5);--> statement-breakpoint
ALTER TABLE `events` ADD `isAllDay` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `durationValue` int;--> statement-breakpoint
ALTER TABLE `events` ADD `durationUnit` enum('minutes','hours','days');