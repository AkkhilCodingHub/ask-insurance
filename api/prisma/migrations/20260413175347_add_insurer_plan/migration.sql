-- AlterTable
ALTER TABLE `policies` ADD COLUMN `insurerId` VARCHAR(191) NULL,
    ADD COLUMN `planId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `insurers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortName` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NOT NULL,
    `brandColor` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(191) NULL,
    `founded` INTEGER NULL,
    `headquarters` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `claimsRatio` DOUBLE NOT NULL,
    `rating` DOUBLE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `insurers_name_key`(`name`),
    UNIQUE INDEX `insurers_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `features` TEXT NOT NULL,
    `minAge` INTEGER NULL,
    `maxAge` INTEGER NULL,
    `minCover` DOUBLE NOT NULL,
    `maxCover` DOUBLE NOT NULL,
    `basePremium` DOUBLE NOT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `insurerId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `plans_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `plans` ADD CONSTRAINT `plans_insurerId_fkey` FOREIGN KEY (`insurerId`) REFERENCES `insurers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `policies` ADD CONSTRAINT `policies_insurerId_fkey` FOREIGN KEY (`insurerId`) REFERENCES `insurers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `policies` ADD CONSTRAINT `policies_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
