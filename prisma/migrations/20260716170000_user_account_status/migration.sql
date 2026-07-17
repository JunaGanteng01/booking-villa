CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED');

ALTER TABLE "users"
ADD COLUMN "status" "UserAccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "phone" VARCHAR(64),
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "department" VARCHAR(100),
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "invitedAt" TIMESTAMP(3),
ADD COLUMN "suspendedAt" TIMESTAMP(3),
ADD COLUMN "suspensionReason" TEXT;

CREATE INDEX "users_status_role_idx" ON "users"("status", "role");
CREATE INDEX "users_department_idx" ON "users"("department");
