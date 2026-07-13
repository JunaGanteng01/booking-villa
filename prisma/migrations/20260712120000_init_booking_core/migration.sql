-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VillaStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'PENDING', 'MAINTENANCE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING', 'WAITING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BookingLineItemType" AS ENUM ('ROOM', 'EXTRA_GUEST', 'ADD_ON', 'DISCOUNT', 'SERVICE_FEE', 'TAX', 'PAYMENT_FEE');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villas" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" VARCHAR(320),
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Bali',
    "province" TEXT NOT NULL DEFAULT 'Bali',
    "country" TEXT NOT NULL DEFAULT 'Indonesia',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "pricePerNight" INTEGER NOT NULL,
    "weekendPricePerNight" INTEGER,
    "capacity" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "sizeSqm" INTEGER,
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "VillaStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "villas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villa_images" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "villa_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villa_amenities" (
    "villaId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "villa_amenities_pkey" PRIMARY KEY ("villaId","amenityId")
);

-- CreateTable
CREATE TABLE "villa_availability" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "bookingId" TEXT,
    "date" DATE NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "priceOverride" INTEGER,
    "minStayNights" INTEGER NOT NULL DEFAULT 1,
    "note" VARCHAR(240),
    "holdExpiresAt" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "villa_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villa_rates" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "pricePerNight" INTEGER NOT NULL,
    "weekendPricePerNight" INTEGER,
    "minStayNights" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "villa_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxDiscount" INTEGER,
    "minNights" INTEGER,
    "minSubtotal" INTEGER,
    "usageLimit" INTEGER,
    "perCustomerLimit" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingCode" VARCHAR(32) NOT NULL,
    "villaId" TEXT NOT NULL,
    "couponId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "nights" INTEGER NOT NULL,
    "guests" INTEGER NOT NULL,
    "guestName" VARCHAR(160) NOT NULL,
    "guestEmail" VARCHAR(190) NOT NULL,
    "guestPhone" VARCHAR(64) NOT NULL,
    "specialRequest" TEXT,
    "subtotal" INTEGER NOT NULL,
    "extraGuestFee" INTEGER NOT NULL DEFAULT 0,
    "addonTotal" INTEGER NOT NULL DEFAULT 0,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    "serviceFee" INTEGER NOT NULL DEFAULT 0,
    "taxTotal" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "depositAmount" INTEGER NOT NULL DEFAULT 0,
    "remainingAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "source" VARCHAR(40) NOT NULL DEFAULT 'website',
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_line_items" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "BookingLineItemType" NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "guestEmail" VARCHAR(190) NOT NULL,
    "amount" INTEGER NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_slug_key" ON "amenities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "villas_slug_key" ON "villas"("slug");

-- CreateIndex
CREATE INDEX "villas_categoryId_idx" ON "villas"("categoryId");

-- CreateIndex
CREATE INDEX "villas_location_idx" ON "villas"("location");

-- CreateIndex
CREATE INDEX "villas_pricePerNight_idx" ON "villas"("pricePerNight");

-- CreateIndex
CREATE INDEX "villas_capacity_idx" ON "villas"("capacity");

-- CreateIndex
CREATE INDEX "villas_status_location_idx" ON "villas"("status", "location");

-- CreateIndex
CREATE INDEX "villas_status_capacity_pricePerNight_idx" ON "villas"("status", "capacity", "pricePerNight");

-- CreateIndex
CREATE INDEX "villas_isFeatured_status_idx" ON "villas"("isFeatured", "status");

-- CreateIndex
CREATE INDEX "villa_images_villaId_sortOrder_idx" ON "villa_images"("villaId", "sortOrder");

-- CreateIndex
CREATE INDEX "villa_images_villaId_isCover_idx" ON "villa_images"("villaId", "isCover");

-- CreateIndex
CREATE INDEX "villa_amenities_amenityId_idx" ON "villa_amenities"("amenityId");

-- CreateIndex
CREATE INDEX "villa_availability_bookingId_idx" ON "villa_availability"("bookingId");

-- CreateIndex
CREATE INDEX "villa_availability_date_status_idx" ON "villa_availability"("date", "status");

-- CreateIndex
CREATE INDEX "villa_availability_villaId_status_date_idx" ON "villa_availability"("villaId", "status", "date");

-- CreateIndex
CREATE UNIQUE INDEX "villa_availability_villaId_date_key" ON "villa_availability"("villaId", "date");

-- CreateIndex
CREATE INDEX "villa_rates_villaId_isActive_startDate_endDate_idx" ON "villa_rates"("villaId", "isActive", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "villa_rates_startDate_endDate_idx" ON "villa_rates"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_isActive_idx" ON "coupons"("code", "isActive");

-- CreateIndex
CREATE INDEX "coupons_startsAt_endsAt_idx" ON "coupons"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingCode_key" ON "bookings"("bookingCode");

-- CreateIndex
CREATE INDEX "bookings_villaId_checkIn_checkOut_idx" ON "bookings"("villaId", "checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "bookings_status_paymentStatus_idx" ON "bookings"("status", "paymentStatus");

-- CreateIndex
CREATE INDEX "bookings_guestEmail_idx" ON "bookings"("guestEmail");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "booking_line_items_bookingId_type_idx" ON "booking_line_items"("bookingId", "type");

-- CreateIndex
CREATE INDEX "coupon_redemptions_couponId_idx" ON "coupon_redemptions"("couponId");

-- CreateIndex
CREATE INDEX "coupon_redemptions_guestEmail_idx" ON "coupon_redemptions"("guestEmail");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_couponId_bookingId_key" ON "coupon_redemptions"("couponId", "bookingId");

-- AddForeignKey
ALTER TABLE "villas" ADD CONSTRAINT "villas_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villa_images" ADD CONSTRAINT "villa_images_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "villas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villa_amenities" ADD CONSTRAINT "villa_amenities_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "villas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villa_amenities" ADD CONSTRAINT "villa_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villa_availability" ADD CONSTRAINT "villa_availability_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "villas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villa_availability" ADD CONSTRAINT "villa_availability_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villa_rates" ADD CONSTRAINT "villa_rates_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "villas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "villas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_line_items" ADD CONSTRAINT "booking_line_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
