import { NextResponse } from "next/server";
import { getBookingByCode, getBookingById, type BookingStoreRecord } from "@/lib/booking-store";
import {
  getGatewaySnapshot,
  getManualPaymentProof,
  getSavedPaymentMethod,
  getStripeCheckoutSession,
  type GatewaySnapshotRecord,
  type ManualPaymentProofRecord,
  type SavedBookingPaymentMethod,
  type StripeCheckoutSessionRecord,
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
        message: "Status pembayaran untuk pesanan ini tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const payment = getSavedPaymentMethod(booking.id);
  const manualProof = getManualPaymentProof(booking.id);
  const midtransSnapshot = getGatewaySnapshot(booking.id);
  const stripeSession = getStripeCheckoutSession(booking.id);
  const provider = resolveProvider(payment, midtransSnapshot, stripeSession);
  const nextAction = resolveNextAction({
    booking,
    payment,
    manualProof,
    midtransSnapshot,
    stripeSession,
  });

  return NextResponse.json({
    data: {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      provider,
      amount: {
        payableNow: booking.amounts.depositAmount,
        remainingAmount: booking.amounts.remainingAmount,
        totalAmount: booking.amounts.totalAmount,
        currency: booking.amounts.currency,
      },
      paymentMethod: payment,
      manualConfirmation: manualProof,
      gateway: midtransSnapshot
        ? {
            provider: midtransSnapshot.provider,
            token: midtransSnapshot.token,
            redirectUrl: midtransSnapshot.redirectUrl,
            amount: midtransSnapshot.amount,
            status: midtransSnapshot.status,
            createdAt: midtransSnapshot.createdAt,
            updatedAt: midtransSnapshot.updatedAt,
          }
        : null,
      stripeSession: stripeSession
        ? {
            provider: stripeSession.provider,
            id: stripeSession.sessionId,
            url: stripeSession.url,
            amount: stripeSession.amount,
            currency: stripeSession.currency,
            paymentStatus: stripeSession.paymentStatus,
            createdAt: stripeSession.createdAt,
            updatedAt: stripeSession.updatedAt,
          }
        : null,
      timeline: {
        bookingCreatedAt: booking.createdAt,
        bookingUpdatedAt: booking.updatedAt,
        paymentMethodSelectedAt: payment?.createdAt ?? null,
        manualProofUploadedAt: manualProof?.createdAt ?? null,
        gatewayCreatedAt: midtransSnapshot?.createdAt ?? null,
        stripeSessionCreatedAt: stripeSession?.createdAt ?? null,
        expiresAt: booking.expiresAt,
      },
      nextAction,
    },
    meta: {
      source: "mock-store",
      note: "Status pembayaran dibaca dari store mock dan siap dipetakan ke tabel Payment/PaymentTransaction.",
    },
  });
}

function resolveProvider(
  payment: SavedBookingPaymentMethod | null,
  midtransSnapshot: GatewaySnapshotRecord | null,
  stripeSession: StripeCheckoutSessionRecord | null,
) {
  if (stripeSession) return "STRIPE";
  if (midtransSnapshot) return "MIDTRANS";
  if (payment?.method.id === "bank-transfer") return "MANUAL_TRANSFER";
  return payment ? "GATEWAY" : null;
}

function resolveNextAction({
  booking,
  payment,
  manualProof,
  midtransSnapshot,
  stripeSession,
}: {
  booking: BookingStoreRecord;
  payment: SavedBookingPaymentMethod | null;
  manualProof: ManualPaymentProofRecord | null;
  midtransSnapshot: GatewaySnapshotRecord | null;
  stripeSession: StripeCheckoutSessionRecord | null;
}) {
  if (booking.paymentStatus === "PAID") {
    return {
      type: "PAYMENT_CONFIRMED",
      label: "Pembayaran sudah terkonfirmasi",
      href: `/payment/status?booking=${booking.id}`,
    };
  }

  if (booking.paymentStatus === "FAILED") {
    return {
      type: "RETRY_PAYMENT",
      label: "Pembayaran gagal, pilih ulang metode pembayaran",
      href: `/payment?booking=${booking.id}`,
    };
  }

  if (booking.paymentStatus === "REFUNDED") {
    return {
      type: "REFUND_COMPLETED",
      label: "Refund telah diproses",
      href: `/payment/status?booking=${booking.id}`,
    };
  }

  if (!payment) {
    return {
      type: "PAYMENT_METHOD_REQUIRED",
      label: "Pilih metode pembayaran",
      href: `/payment?booking=${booking.id}`,
    };
  }

  if (payment.method.id === "bank-transfer") {
    return manualProof
      ? {
          type: "WAITING_MANUAL_REVIEW",
          label: "Menunggu verifikasi admin",
          href: `/payment/status?booking=${booking.id}`,
        }
      : {
          type: "UPLOAD_MANUAL_PROOF",
          label: "Unggah bukti transfer",
          href: `/payment/manual?booking=${booking.id}`,
        };
  }

  if (stripeSession) {
    return {
      type: "WAITING_STRIPE_CALLBACK",
      label: "Menunggu konfirmasi Stripe",
      href: stripeSession.url,
    };
  }

  if (midtransSnapshot) {
    return {
      type: "WAITING_MIDTRANS_CALLBACK",
      label: "Menunggu konfirmasi Midtrans",
      href: midtransSnapshot.redirectUrl,
    };
  }

  return {
    type: "CREATE_GATEWAY_SESSION",
    label: "Lanjutkan ke gateway pembayaran",
    href: `/api/bookings/${booking.id}/payment-gateway/session`,
  };
}
