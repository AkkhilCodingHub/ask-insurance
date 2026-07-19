-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey`;

-- DropIndex
DROP INDEX `notifications_userId_isRead_idx` ON `notifications`;

-- DropIndex
DROP INDEX `otp_challenges_phone_idx` ON `otp_challenges`;

-- AlterTable
ALTER TABLE `admins` ADD COLUMN `storageUsed` BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `policies` MODIFY `notes` TEXT NULL;

-- AlterTable
ALTER TABLE `quotes` MODIFY `adminResponse` TEXT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `kycDocType` VARCHAR(191) NULL,
    ADD COLUMN `kycDocUrl` VARCHAR(191) NULL,
    ADD COLUMN `kycRejectionReason` VARCHAR(191) NULL,
    ADD COLUMN `kycSubmittedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `admin_files` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `size` BIGINT NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NOT NULL,

    INDEX `admin_files_adminId_idx`(`adminId`),
    INDEX `admin_files_adminId_createdAt_idx`(`adminId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `admins_isActive_idx` ON `admins`(`isActive`);

-- CreateIndex
CREATE INDEX `admins_createdAt_idx` ON `admins`(`createdAt`);

-- CreateIndex
CREATE INDEX `claims_userId_status_idx` ON `claims`(`userId`, `status`);

-- CreateIndex
CREATE INDEX `claims_userId_createdAt_idx` ON `claims`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `claims_status_idx` ON `claims`(`status`);

-- CreateIndex
CREATE INDEX `insurers_isActive_idx` ON `insurers`(`isActive`);

-- CreateIndex
CREATE INDEX `insurers_createdAt_idx` ON `insurers`(`createdAt`);

-- CreateIndex
CREATE INDEX `notifications_userId_idx` ON `notifications`(`userId`);

-- CreateIndex
CREATE INDEX `notifications_userId_createdAt_idx` ON `notifications`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `otp_challenges_phone_expiresAt_idx` ON `otp_challenges`(`phone`, `expiresAt`);

-- CreateIndex
CREATE INDEX `otp_challenges_phone_consumedAt_idx` ON `otp_challenges`(`phone`, `consumedAt`);

-- CreateIndex
CREATE INDEX `payments_policyId_status_idx` ON `payments`(`policyId`, `status`);

-- CreateIndex
CREATE INDEX `payments_userId_status_idx` ON `payments`(`userId`, `status`);

-- CreateIndex
CREATE INDEX `payments_status_idx` ON `payments`(`status`);

-- CreateIndex
CREATE INDEX `payments_createdAt_idx` ON `payments`(`createdAt`);

-- CreateIndex
CREATE INDEX `plans_isActive_idx` ON `plans`(`isActive`);

-- CreateIndex
CREATE INDEX `plans_createdAt_idx` ON `plans`(`createdAt`);

-- CreateIndex
CREATE INDEX `policies_userId_status_idx` ON `policies`(`userId`, `status`);

-- CreateIndex
CREATE INDEX `policies_userId_createdAt_idx` ON `policies`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `policies_userId_paymentStatus_idx` ON `policies`(`userId`, `paymentStatus`);

-- CreateIndex
CREATE INDEX `policies_status_idx` ON `policies`(`status`);

-- CreateIndex
CREATE INDEX `quotes_userId_status_idx` ON `quotes`(`userId`, `status`);

-- CreateIndex
CREATE INDEX `quotes_userId_expiresAt_idx` ON `quotes`(`userId`, `expiresAt`);

-- CreateIndex
CREATE INDEX `quotes_userId_createdAt_idx` ON `quotes`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `quotes_status_expiresAt_idx` ON `quotes`(`status`, `expiresAt`);

-- CreateIndex
CREATE INDEX `users_createdAt_idx` ON `users`(`createdAt`);

-- CreateIndex
CREATE INDEX `users_email_idx` ON `users`(`email`);

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_files` ADD CONSTRAINT `admin_files_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `claims` RENAME INDEX `claims_policyId_fkey` TO `claims_policyId_idx`;

-- RenameIndex
ALTER TABLE `otp_challenges` RENAME INDEX `otp_challenges_userId_fkey` TO `otp_challenges_userId_idx`;

-- RenameIndex
ALTER TABLE `plans` RENAME INDEX `plans_insurerId_fkey` TO `plans_insurerId_idx`;

-- RenameIndex
ALTER TABLE `policies` RENAME INDEX `policies_insurerId_fkey` TO `policies_insurerId_idx`;

-- RenameIndex
ALTER TABLE `policies` RENAME INDEX `policies_planId_fkey` TO `policies_planId_idx`;
