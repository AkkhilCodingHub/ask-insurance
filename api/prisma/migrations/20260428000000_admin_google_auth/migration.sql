-- Make password nullable for Google-only admin accounts
ALTER TABLE `admins` MODIFY COLUMN `password` VARCHAR(191) NULL;

-- Add googleId column for linking Google accounts
ALTER TABLE `admins` ADD COLUMN `googleId` VARCHAR(191) NULL;

-- Unique index so two admins can't share the same Google account
CREATE UNIQUE INDEX `admins_googleId_key` ON `admins`(`googleId`);
