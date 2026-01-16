-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `idempotencyKey` VARCHAR(64) NULL DEFAULT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `idempotencyKey` ON `transactions`(`idempotencyKey`);
