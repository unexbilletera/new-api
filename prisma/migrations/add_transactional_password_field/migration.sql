-- AlterTable
ALTER TABLE `users` ADD COLUMN `transactionalPassword` VARCHAR(255) NULL DEFAULT NULL AFTER `password`;

-- CreateIndex
CREATE INDEX `idx_transactional_password_created` ON `users`(`transactionalPassword`, `createdAt`);
