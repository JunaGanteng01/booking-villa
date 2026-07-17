-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'REQUIRES_ACTION', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "externalReference" VARCHAR(191),
    "amount" INTEGER NOT NULL,
    "feeAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "providerPayload" JSONB,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(120) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "providerEventId" VARCHAR(191) NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "requestedById" TEXT,
    "processedById" TEXT,
    "providerRefundId" VARCHAR(191),
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "failureReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actorId" TEXT,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_externalReference_key" ON "payments"("externalReference");
CREATE INDEX "payments_bookingId_status_idx" ON "payments"("bookingId", "status");
CREATE INDEX "payments_provider_status_createdAt_idx" ON "payments"("provider", "status", "createdAt");
CREATE INDEX "payments_paymentMethodId_idx" ON "payments"("paymentMethodId");

CREATE INDEX "payment_proofs_paymentId_status_idx" ON "payment_proofs"("paymentId", "status");
CREATE INDEX "payment_proofs_status_uploadedAt_idx" ON "payment_proofs"("status", "uploadedAt");
CREATE INDEX "payment_proofs_reviewerId_idx" ON "payment_proofs"("reviewerId");

CREATE UNIQUE INDEX "payment_events_providerEventId_key" ON "payment_events"("providerEventId");
CREATE INDEX "payment_events_paymentId_createdAt_idx" ON "payment_events"("paymentId", "createdAt");
CREATE INDEX "payment_events_eventType_createdAt_idx" ON "payment_events"("eventType", "createdAt");

CREATE UNIQUE INDEX "refunds_providerRefundId_key" ON "refunds"("providerRefundId");
CREATE INDEX "refunds_paymentId_status_idx" ON "refunds"("paymentId", "status");
CREATE INDEX "refunds_status_requestedAt_idx" ON "refunds"("status", "requestedAt");
CREATE INDEX "refunds_requestedById_idx" ON "refunds"("requestedById");
CREATE INDEX "refunds_processedById_idx" ON "refunds"("processedById");

CREATE INDEX "booking_status_history_bookingId_createdAt_idx" ON "booking_status_history"("bookingId", "createdAt");
CREATE INDEX "booking_status_history_actorId_idx" ON "booking_status_history"("actorId");
CREATE INDEX "booking_status_history_toStatus_createdAt_idx" ON "booking_status_history"("toStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
