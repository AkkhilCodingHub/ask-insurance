-- Add KYC fields to users table
ALTER TABLE `users`
  ADD COLUMN `kycStatus`       VARCHAR(191) NOT NULL DEFAULT 'pending',
  ADD COLUMN `digilockerSub`   VARCHAR(191) NULL,
  ADD COLUMN `aadhaarVerified` BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN `panNumber`       VARCHAR(191) NULL,
  ADD COLUMN `kycDocuments`    JSON         NULL,
  ADD COLUMN `kycVerifiedAt`   DATETIME(3)  NULL;

CREATE UNIQUE INDEX `users_digilockerSub_key` ON `users`(`digilockerSub`);
