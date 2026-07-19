CREATE TABLE `actionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`defectId` int NOT NULL,
	`actionTaken` text NOT NULL,
	`nextAction` text,
	`engineerId` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `actionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aircraft` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registration` varchar(20) NOT NULL,
	`model` varchar(100) NOT NULL,
	`location` varchar(100),
	`status` enum('SERVICEABLE','DEFERRED','AOG') NOT NULL DEFAULT 'SERVICEABLE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aircraft_id` PRIMARY KEY(`id`),
	CONSTRAINT `aircraft_registration_unique` UNIQUE(`registration`)
);
--> statement-breakpoint
CREATE TABLE `cabinDefects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aircraftId` int NOT NULL,
	`area` varchar(100),
	`description` text NOT NULL,
	`isMel` int DEFAULT 0,
	`melItemId` int,
	`reportedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cabinDefects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aircraftId` int NOT NULL,
	`source` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`status` enum('OPEN','CLOSED','DEFERRED') NOT NULL DEFAULT 'OPEN',
	`reportedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `defects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `melItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`defectId` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`reference` varchar(100),
	`expiryDate` timestamp,
	`placardRequired` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `melItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spareParts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partCode` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`location` varchar(100),
	`minStock` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spareParts_id` PRIMARY KEY(`id`),
	CONSTRAINT `spareParts_partCode_unique` UNIQUE(`partCode`)
);
