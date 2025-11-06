/*
  Warnings:

  - You are about to drop the column `failed2FAAttempts` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorLockedUntil` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "failed2FAAttempts",
DROP COLUMN "twoFactorLockedUntil";
