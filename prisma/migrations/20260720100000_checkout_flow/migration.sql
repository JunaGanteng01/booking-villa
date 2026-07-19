-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('ACTIVE', 'CHECKOUT_REQUESTED', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "CheckoutChannel" AS ENUM ('WEBSITE', 'RECEPTION_DESK');

-- CreateTable
CREATE TABLE "checkouts" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'ACTIVE',
    "channel" "CheckoutChannel",
    "requestedById" TEXT,
    "processedById" TEXT,
    "requestedAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "guestVerifiedAt" TIMESTAMP(3),
    "paymentVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_events" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "actorId" TEXT,
    "fromStatus" "CheckoutStatus",
    "toStatus" "CheckoutStatus" NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkout_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkouts_bookingId_key" ON "checkouts"("bookingId");

-- CreateIndex
CREATE INDEX "checkouts_status_requestedAt_idx" ON "checkouts"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "checkouts_processedById_checkedOutAt_idx" ON "checkouts"("processedById", "checkedOutAt");

-- CreateIndex
CREATE INDEX "checkout_events_checkoutId_createdAt_idx" ON "checkout_events"("checkoutId", "createdAt");

-- CreateIndex
CREATE INDEX "checkout_events_actorId_idx" ON "checkout_events"("actorId");

-- CreateIndex
CREATE INDEX "checkout_events_toStatus_createdAt_idx" ON "checkout_events"("toStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_events" ADD CONSTRAINT "checkout_events_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_events" ADD CONSTRAINT "checkout_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
