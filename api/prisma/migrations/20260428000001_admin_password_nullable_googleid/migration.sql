-- Make password nullable (Google-only admins have no password)
ALTER TABLE `admins` MODIFY COLUMN `password` VARCHAR(191) NULL;

-- Add googleId column (only if it doesn't already exist)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'admins'
    AND COLUMN_NAME  = 'googleId'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `admins` ADD COLUMN `googleId` VARCHAR(191) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add unique index (only if it doesn't already exist)
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'admins'
    AND INDEX_NAME   = 'admins_googleId_key'
);
SET @sql2 = IF(@idx_exists = 0,
  'CREATE UNIQUE INDEX `admins_googleId_key` ON `admins`(`googleId`)',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
