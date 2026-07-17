CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'FLAGGED');

ALTER TABLE "reviews"
ADD COLUMN "title" VARCHAR(180),
ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "moderationNote" TEXT,
ADD COLUMN "moderatedAt" TIMESTAMP(3);

UPDATE "reviews" SET "status" = 'PUBLISHED';

CREATE INDEX "reviews_status_createdAt_idx" ON "reviews"("status", "createdAt");
CREATE INDEX "reviews_isFeatured_status_idx" ON "reviews"("isFeatured", "status");
