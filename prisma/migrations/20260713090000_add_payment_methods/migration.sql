-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'CREDIT_CARD', 'E_WALLET', 'QRIS');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MANUAL', 'MIDTRANS', 'STRIPE', 'XENDIT', 'MOCK');

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MOCK',
    "description" TEXT,
    "instructions" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "fixedFee" INTEGER NOT NULL DEFAULT 0,
    "percentageFee" DECIMAL(5,2),
    "minAmount" INTEGER,
    "maxAmount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresProof" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_code_key" ON "payment_methods"("code");

-- CreateIndex
CREATE INDEX "payment_methods_type_provider_idx" ON "payment_methods"("type", "provider");

-- CreateIndex
CREATE INDEX "payment_methods_isActive_sortOrder_idx" ON "payment_methods"("isActive", "sortOrder");
