import { NextResponse } from "next/server";
import { getBookingByCode, getBookingById } from "@/lib/booking-store";
import {
  createGatewaySnapshot,
  getSavedPaymentMethod,
} from "@/lib/payment-store";

export async function POST(request: Request) {
  const bookingId = decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean)[2] ?? "",
  );
  const booking = getBookingById(bookingId) ?? getBookingByCode(bookingId);

  if (!booking) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const payment = getSavedPaymentMethod(booking.id);
  if (!payment) {
    return NextResponse.json(
      {
        error: "PAYMENT_METHOD_REQUIRED",
        message: "Pilih metode pembayaran sebelum membuat snapshot gateway.",
      },
      { status: 409 },
    );
  }

  if (payment.method.id === "bank-transfer") {
    return NextResponse.json(
      {
        error: "MANUAL_PAYMENT_METHOD",
        message: "Metode transfer manual tidak membutuhkan snapshot Midtrans.",
      },
      { status: 409 },
    );
  }

  const snapshot = createGatewaySnapshot(booking, payment);

  return NextResponse.json(
    {
      data: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        payment,
        snapshot: {
          provider: snapshot.provider,
          token: snapshot.token,
          redirectUrl: snapshot.redirectUrl,
          amount: snapshot.amount,
          status: snapshot.status,
        },
        midtransPayload: snapshot.payload,
      },
      meta: {
        source: "mock-store",
        provider: "midtrans",
        note: "Snapshot Midtrans masih mock. Ganti dengan panggilan Snap API saat kredensial tersedia.",
      },
    },
    { status: 201 },
  );
}
