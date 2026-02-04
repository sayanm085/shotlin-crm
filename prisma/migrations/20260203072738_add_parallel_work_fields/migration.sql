-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "appDevDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "appTestingDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "appUiDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uploadApkDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uploadAssetsDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uploadScreenshotsDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "websiteDesignDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "websiteDevDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "websiteSearchConsoleDone" BOOLEAN NOT NULL DEFAULT false;
