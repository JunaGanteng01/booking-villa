import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingByCode, updateBookingPaymentState } from "@/lib/booking-store";

type MidtransNotification = {
  order_id?: string;
  transaction_id?: string;
  transaction_status?: string;
  fraud_status?: string;
  status_code?: string;
  gross_amount?: string;
  payment_type?: string;
  signature_key?: string;
};

export async function POST(request: Request) {
  let payload: MidtransNotification;

  try {
    payload = (await request.json()) as MidtransNotification;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Body webhook harus JSON valid.",
      },
      { status: 400 },
    );
  }

  const orderId = normalizeString(payload.order_id);
  if (!orderId) {
    return NextResponse.json(
      {
        error: "ORDER_ID_REQUIRED",
        message: "order_id wajib ada pada payload Midtrans.",
      },
      { status: 400 },
    );
  }

  const signatureValidation = validateSignature(payload);
  if (!signatureValidation.ok) {
    return NextResponse.json(
      {
        error: "INVALID_SIGNATURE",
        message: signatureValidation.message,
      },
      { status: 401 },
    );
  }

  const booking = getBookingByCode(orderId);
  if (!booking) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Booking untuk order_id ini tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const mappedStatus = mapMidtransStatus(payload);
  const updatedBooking = updateBookingPaymentState(booking.id, mappedStatus.bookingState);

  return NextResponse.json({
    data: {
      received: true,
      provider: "MIDTRANS",
      orderId,
      transactionId: normalizeString(payload.transaction_id) || null,
      transactionStatus: normalizeString(payload.transaction_status),
      fraudStatus: normalizeString(payload.fraud_status) || null,
      paymentType: normalizeString(payload.payment_type) || null,
      mappedStatus: mappedStatus.label,
      booking: updatedBooking,
    },
    meta: {
      source: "mock-store",
      signature: signatureValidation.mode,
    },
  });
}

function validateSignature(payload: MidtransNotification) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const signature = normalizeString(payload.signature_key);

  if (!serverKey) {
    return {
      ok: true as const,
      mode: "skipped-no-server-key",
    };
  }

  if (!signature) {
    return {
      ok: false as const,
      message: "signature_key wajib ada saat MIDTRANS_SERVER_KEY dikonfigurasi.",
    };
  }

  const raw = `${normalizeString(payload.order_id)}${normalizeString(payload.status_code)}${normalizeString(payload.gross_amount)}${serverKey}`;
  const expected = createHash("sha512").update(raw).digest("hex");

  return signature === expected
    ? { ok: true as const, mode: "verified" }
    : { ok: false as const, message: "signature_key tidak valid." };
}

function mapMidtransStatus(payload: MidtransNotification) {
  const transactionStatus = normalizeString(payload.transaction_status);
  const fraudStatus = normalizeString(payload.fraud_status);

  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") {
      return {
        label: "CHALLENGE",
        bookingState: {
          status: "WAITING_PAYMENT" as const,
          paymentStatus: "UNPAID" as const,
        },
      };
    }

    return {
      label: "PAID",
      bookingState: {
        status: "CONFIRMED" as const,
        paymentStatus: "PAID" as const,
      },
    };
  }

  if (transactionStatus === "settlement") {
    return {
      label: "PAID",
      bookingState: {
        status: "CONFIRMED" as const,
        paymentStatus: "PAID" as const,
      },
    };
  }

  if (transactionStatus === "pending") {
    return {
      label: "PENDING",
      bookingState: {
        status: "WAITING_PAYMENT" as const,
        paymentStatus: "UNPAID" as const,
      },
    };
  }

  if (["deny", "cancel", "expire", "failure"].includes(transactionStatus)) {
    return {
      label: "FAILED",
      bookingState: {
        status: "CANCELLED" as const,
        paymentStatus: "UNPAID" as const,
      },
    };
  }

  if (transactionStatus === "refund") {
    return {
      label: "REFUNDED",
      bookingState: {
        status: "REFUNDED" as const,
        paymentStatus: "UNPAID" as const,
      },
    };
  }

  return {
    label: "UNKNOWN",
    bookingState: {
      status: "WAITING_PAYMENT" as const,
      paymentStatus: "UNPAID" as const,
    },
  };
}

function normalizeString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}
