CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`location` varchar(255) NOT NULL,
	`locationAddress` text,
	`locationLatitude` decimal(10,8),
	`locationLongitude` decimal(10,8),
	`organizerName` varchar(255) NOT NULL,
	`organizerEmail` varchar(320) NOT NULL,
	`organizerPhone` varchar(20),
	`organizerUrl` varchar(2048),
	`eventUrl` varchar(2048),
	`imageUrl` varchar(2048),
	`eventType` enum('fundraiser','rally','meeting','training','social','other') NOT NULL DEFAULT 'other',
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`submittedBy` int NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','representative','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `organization` varchar(255);