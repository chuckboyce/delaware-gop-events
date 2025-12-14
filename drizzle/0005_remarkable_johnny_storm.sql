CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`organizationType` enum('committee','club','group','campaign','party','other') NOT NULL DEFAULT 'other',
	`email` varchar(320),
	`phone` varchar(20),
	`website` varchar(2048),
	`logoUrl` varchar(2048),
	`location` varchar(255),
	`verified` enum('unverified','verified','pending') NOT NULL DEFAULT 'unverified',
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `organizers`;--> statement-breakpoint
ALTER TABLE `events` ADD `organizationId` int;