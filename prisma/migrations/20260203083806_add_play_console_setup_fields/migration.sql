-- AlterTable
ALTER TABLE "PlayConsoleStatus" ADD COLUMN     "accountPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "developerInviteEmail" TEXT,
ADD COLUMN     "developerInvited" BOOLEAN NOT NULL DEFAULT false;
