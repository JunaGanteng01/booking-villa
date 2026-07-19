import { NextResponse } from "next/server";
import {
  BookingPaymentFlowError,
  getDatabaseBookingRecord,
  saveDatabasePaymentMethod,
} from "@/lib/booking-database";
import { canAccessBooking } from "@/lib/booking-access";
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
  const booking = await getDatabaseBookingRecord(bookingId);

  if (!booking) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
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

  let databasePayment;
  try {
    databasePayment = await saveDatabasePaymentMethod({
      bookingIdentifier: booking.id,
      method,
    });
  } catch (error) {
    if (error instanceof BookingPaymentFlowError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status },
      );
    }
    console.error("Save payment method database error", error);
    return NextResponse.json(
      {
        error: "DATABASE_UNAVAILABLE",
        message: "Metode pembayaran belum dapat disimpan. Silakan coba kembali.",
      },
      { status: 503 },
    );
  }
  if (!databasePayment) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Pesanan tidak ditemukan di database.",
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
      source: "database",
      note: "Metode pembayaran tersimpan dan dapat dilihat oleh Finance.",
    },
  });
}
