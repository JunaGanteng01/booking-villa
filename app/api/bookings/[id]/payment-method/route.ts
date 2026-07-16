import { NextResponse } from "next/server";
import { getBookingByCode, getBookingById } from "@/lib/booking-store";
import {
  getPaymentMethodById,
  savePaymentMethodForBooking,
} from "@/lib/payment-store";
import { triggerPaymentMethodSelected } from "@/lib/notification-triggers";

type SavePaymentMethodInput = {
  methodId?: string | null;
};

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

  let body: SavePaymentMethodInput;

  try {
    body = (await request.json()) as SavePaymentMethodInput;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Body request harus JSON valid.",
      },
      { status: 400 },
    );
  }

  const methodId = typeof body.methodId === "string" ? body.methodId.trim() : "";
  if (!methodId) {
    return NextResponse.json(
      {
        error: "PAYMENT_METHOD_REQUIRED",
        message: "methodId wajib diisi.",
      },
      { status: 400 },
    );
  }

  const method = getPaymentMethodById(methodId);
  if (!method) {
    return NextResponse.json(
      {
        error: "PAYMENT_METHOD_NOT_FOUND",
        message: "Metode pembayaran tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const payment = savePaymentMethodForBooking(booking, method);
  void triggerPaymentMethodSelected(booking, method.title);

  return NextResponse.json({
    data: {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      payment,
    },
    meta: {
      source: "mock-store",
      note: "Metode pembayaran tersimpan untuk pesanan ini.",
    },
  });
}
