-- Quote flow v2: admin-responded quotes + policy documents

ALTER TABLE `quotes`
  ADD COLUMN `adminResponse`   LONGTEXT     NULL,
  ADD COLUMN `adminResponseAt` DATETIME(3)  NULL,
  ADD COLUMN `approvedAt`      DATETIME(3)  NULL,
  MODIFY COLUMN `status`       VARCHAR(191) NOT NULL DEFAULT 'pending';

ALTER TABLE `policies`
  ADD COLUMN `documentUrl` VARCHAR(191) NULL,
  ADD COLUMN `notes`       LONGTEXT     NULL;
