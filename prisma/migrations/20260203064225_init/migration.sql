-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NOT_STARTED', 'PENDING_CLIENT', 'PENDING_VERIFICATION', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('NOT_CREATED', 'PENDING', 'APPROVED');

-- CreateEnum
CREATE TYPE "Responsibility" AS ENUM ('CLIENT', 'COMPANY');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('INDIVIDUAL', 'FIRM', 'PVT_LTD');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ICON', 'SHORT_DESCRIPTION', 'LONG_DESCRIPTION', 'FEATURE_GRAPHIC', 'SCREENSHOT', 'PREVIEW_VIDEO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "companyType" "CompanyType" NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "msmeStatus" "ComplianceStatus" NOT NULL DEFAULT 'NOT_CREATED',
    "msmeDocumentUrl" TEXT,
    "dunsStatus" "ComplianceStatus" NOT NULL DEFAULT 'NOT_CREATED',
    "dunsDocumentUrl" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteTask" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "dependencyTask" TEXT,
    "owner" "Responsibility" NOT NULL DEFAULT 'COMPANY',
    "blockedReason" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayConsoleStatus" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "accountCreated" BOOLEAN NOT NULL DEFAULT false,
    "accountEmail" TEXT,
    "identityVerificationStatus" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "companyVerificationStatus" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "paymentProfileStatus" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "consoleReady" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayConsoleStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppDevelopmentTask" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "dependency" TEXT,
    "responsibility" "Responsibility" NOT NULL DEFAULT 'COMPANY',
    "blockedReason" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppDevelopmentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayStoreAsset" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "validationRule" TEXT NOT NULL,
    "assetUrl" TEXT,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "validationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayStoreAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionReview" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3),
    "internalTesting" BOOLEAN NOT NULL DEFAULT false,
    "internalTestingAt" TIMESTAMP(3),
    "productionSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "productionSubmittedAt" TIMESTAMP(3),
    "reviewStatus" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "liveUrl" TEXT,
    "rejectionReason" TEXT,
    "rejectionFault" "Responsibility",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMilestone" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "milestoneName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "eligibleForPayment" BOOLEAN NOT NULL DEFAULT false,
    "eligibleAt" TIMESTAMP(3),
    "released" BOOLEAN NOT NULL DEFAULT false,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clientId_key" ON "User"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Client_panNumber_key" ON "Client"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceDocument_clientId_key" ON "ComplianceDocument"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteTask_clientId_taskName_key" ON "WebsiteTask"("clientId", "taskName");

-- CreateIndex
CREATE UNIQUE INDEX "PlayConsoleStatus_clientId_key" ON "PlayConsoleStatus"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "AppDevelopmentTask_clientId_moduleName_key" ON "AppDevelopmentTask"("clientId", "moduleName");

-- CreateIndex
CREATE UNIQUE INDEX "PlayStoreAsset_clientId_assetType_key" ON "PlayStoreAsset"("clientId", "assetType");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionReview_clientId_key" ON "SubmissionReview"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMilestone_clientId_milestoneName_key" ON "PaymentMilestone"("clientId", "milestoneName");

-- CreateIndex
CREATE INDEX "AuditLog_clientId_idx" ON "AuditLog"("clientId");

-- CreateIndex
CREATE INDEX "AuditLog_tableName_idx" ON "AuditLog"("tableName");

-- CreateIndex
CREATE INDEX "AuditLog_changedAt_idx" ON "AuditLog"("changedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteTask" ADD CONSTRAINT "WebsiteTask_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayConsoleStatus" ADD CONSTRAINT "PlayConsoleStatus_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppDevelopmentTask" ADD CONSTRAINT "AppDevelopmentTask_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayStoreAsset" ADD CONSTRAINT "PlayStoreAsset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMilestone" ADD CONSTRAINT "PaymentMilestone_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
