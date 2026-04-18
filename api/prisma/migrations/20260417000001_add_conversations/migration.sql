CREATE TABLE `conversations` (
  `id`        VARCHAR(191) NOT NULL,
  `subject`   VARCHAR(191) NULL,
  `status`    VARCHAR(191) NOT NULL DEFAULT 'open',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `userId`    VARCHAR(191) NOT NULL,
  `adminId`   VARCHAR(191) NULL,

  INDEX `conversations_userId_idx`(`userId`),
  INDEX `conversations_status_idx`(`status`),
  INDEX `conversations_updatedAt_idx`(`updatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `messages` (
  `id`             VARCHAR(191) NOT NULL,
  `content`        TEXT NOT NULL,
  `senderType`     VARCHAR(191) NOT NULL,
  `senderId`       VARCHAR(191) NOT NULL,
  `readAt`         DATETIME(3) NULL,
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `conversationId` VARCHAR(191) NOT NULL,

  INDEX `messages_conversationId_idx`(`conversationId`),
  INDEX `messages_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_adminId_fkey`
  FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `messages`
  ADD CONSTRAINT `messages_conversationId_fkey`
  FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
