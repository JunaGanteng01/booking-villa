import { NextResponse } from "next/server";
import { getBookingByCode, getBookingById } from "@/lib/booking-store";

export async function GET(request: Request) {
  const id = decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean)[2] ?? "",
  );
  const booking = getBookingById(id) ?? getBookingByCode(id);

  if (!booking) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Ringkasan pesanan tidak ditemukan.",
      },
      { status: 404 },
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
        type: booking.paymentStatus === "UNPAID" ? "PAYMENT_REQUIRED" : "VIEW_STATUS",
        amount: booking.amounts.depositAmount,
        href: "/payment",
      },
    },
    meta: {
      source: "mock-store",
      note: "Ringkasan diambil dari in-memory booking store.",
    },
  });
}
