import { NextResponse } from "next/server";
import { getBookingByCode, getBookingById } from "@/lib/booking-store";
import { createInvoiceFileName, generateInvoicePdf } from "@/lib/invoice-pdf";
import {
  getGatewaySnapshot,
  getManualPaymentProof,
  getSavedPaymentMethod,
  getStripeCheckoutSession,
} from "@/lib/payment-store";

export async function GET(request: Request) {
  const bookingId = decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean)[2] ?? "",
  );
  const booking = getBookingById(bookingId) ?? getBookingByCode(bookingId);

  if (!booking) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Invoice untuk pesanan ini tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const payment = getSavedPaymentMethod(booking.id);
  const manualConfirmation = getManualPaymentProof(booking.id);
  const stripeSession = getStripeCheckoutSession(booking.id);
  const gatewaySnapshot = getGatewaySnapshot(booking.id);
  const pdf = generateInvoicePdf({
    booking,
    payment,
    manualConfirmation,
    stripeSession,
    provider: resolveProvider({
      paymentMethodId: payment?.method.id,
      hasMidtransSnapshot: Boolean(gatewaySnapshot),
      hasStripeSession: Boolean(stripeSession),
    }),
  });

  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="${createInvoiceFileName(booking)}"`,
      "Cache-Control": "no-store",
    },
  });
}

function resolveProvider({
  paymentMethodId,
  hasMidtransSnapshot,
  hasStripeSession,
}: {
  paymentMethodId?: string;
  hasMidtransSnapshot: boolean;
  hasStripeSession: boolean;
}) {
  if (hasStripeSession) return "STRIPE";
  if (hasMidtransSnapshot) return "MIDTRANS";
  if (paymentMethodId === "bank-transfer") return "MANUAL_TRANSFER";
  return "PAYMENT_GATEWAY";
}
