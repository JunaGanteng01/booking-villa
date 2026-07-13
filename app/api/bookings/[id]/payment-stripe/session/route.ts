import { NextResponse } from "next/server";
import { getBookingByCode, getBookingById } from "@/lib/booking-store";
import {
  createStripeCheckoutSession,
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
        message: "Pilih metode pembayaran sebelum membuat checkout session Stripe.",
      },
      { status: 409 },
    );
  }

  if (payment.method.id === "bank-transfer") {
    return NextResponse.json(
      {
        error: "MANUAL_PAYMENT_METHOD",
        message: "Metode transfer manual tidak membutuhkan checkout session Stripe.",
      },
      { status: 409 },
    );
  }

  const session = createStripeCheckoutSession(booking, payment);

  return NextResponse.json(
    {
      data: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        payment,
        stripeSession: {
          provider: session.provider,
          id: session.sessionId,
          url: session.url,
          amount: session.amount,
          currency: session.currency,
          paymentStatus: session.paymentStatus,
        },
        stripePayload: session.payload,
      },
      meta: {
        source: "mock-store",
        provider: "stripe",
        note: "Checkout session Stripe masih mock. Ganti dengan Stripe SDK/API saat kredensial tersedia.",
      },
    },
    { status: 201 },
  );
}
