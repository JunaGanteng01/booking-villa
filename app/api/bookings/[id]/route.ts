import { NextResponse } from "next/server";
import { canAccessBooking } from "@/lib/booking-access";
import { getDatabaseBookingRecord } from "@/lib/booking-database";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  const id = decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean)[2] ?? "",
  );
  let booking = null;
  try {
    booking = await getDatabaseBookingRecord(id);
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Booking detail database error", error);
      return NextResponse.json(
        { error: "BOOKING_DETAIL_FAILED", message: "Ringkasan pesanan belum dapat dimuat." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        error: "DATABASE_UNAVAILABLE",
        message: "Database PostgreSQL belum tersedia.",
      },
      { status: 503 },
    );
  }

  if (!booking) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Ringkasan pesanan tidak ditemukan.",
      },
      { status: 404 },
    );
  }
  if (!canAccessBooking(request, booking)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Anda tidak memiliki akses ke booking ini." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    data: {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      villa: {
        id: booking.villaId,
        name: booking.villaName,
      },
      stay: {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        guests: booking.guests,
      },
      guest: booking.guest,
      coupon: booking.coupon,
      addOns: booking.addOns,
      lineItems: booking.lineItems,
      availabilityLocks: booking.availabilityLocks,
      amounts: booking.amounts,
      timeline: {
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        expiresAt: booking.expiresAt,
      },
      nextAction: {
        type:
          booking.paymentStatus === "UNPAID"
            ? "PAYMENT_REQUIRED"
            : "VIEW_STATUS",
        amount: booking.amounts.depositAmount,
        href:
          booking.paymentStatus === "UNPAID"
            ? `/payment?booking=${booking.bookingCode}`
            : `/payment/status?booking=${booking.bookingCode}`,
      },
    },
    meta: {
      source: "database",
      generatedAt: new Date().toISOString(),
    },
  });
}
