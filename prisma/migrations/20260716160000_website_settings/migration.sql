CREATE TABLE "website_settings" (
  "key" VARCHAR(80) NOT NULL,
  "value" JSONB NOT NULL,
  "group" VARCHAR(80) NOT NULL DEFAULT 'general',
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "website_settings_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "website_settings_group_isPublic_idx" ON "website_settings"("group", "isPublic");
