/*
  Warnings:

  - You are about to drop the column `accountEmail` on the `PlayConsoleStatus` table. All the data in the column will be lost.
  - The `identityVerificationStatus` column on the `PlayConsoleStatus` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `companyVerificationStatus` column on the `PlayConsoleStatus` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentProfileStatus` column on the `PlayConsoleStatus` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "appApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "liveUrl" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "websiteVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PlayConsoleStatus" DROP COLUMN "accountEmail",
ADD COLUMN     "consoleEmail" TEXT,
DROP COLUMN "identityVerificationStatus",
ADD COLUMN     "identityVerificationStatus" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "companyVerificationStatus",
ADD COLUMN     "companyVerificationStatus" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "paymentProfileStatus",
ADD COLUMN     "paymentProfileStatus" BOOLEAN NOT NULL DEFAULT false;
