CREATE TABLE `organizerAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`role` enum('admin','editor','viewer') NOT NULL DEFAULT 'editor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizerAccess_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizerRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255) NOT NULL,
	`organizationName` varchar(255) NOT NULL,
	`organizationType` enum('committee','club','group','campaign','party','other') NOT NULL DEFAULT 'other',
	`phone` varchar(20),
	`message` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizerRequests_id` PRIMARY KEY(`id`)
);
