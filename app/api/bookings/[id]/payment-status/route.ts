import { NextResponse } from "next/server";
import { canAccessBooking } from "@/lib/booking-access";
import {
  getDatabaseBookingRecord,
  getDatabasePaymentSnapshot,
} from "@/lib/booking-database";
import type { BookingStoreRecord } from "@/lib/booking-store";
import { paymentMethods } from "@/lib/booking-draft";
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
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  const bookingId = decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean)[2] ?? "",
  );
  let booking: BookingStoreRecord | null = null;
  let databasePayment: Awaited<ReturnType<typeof getDatabasePaymentSnapshot>> = null;

  try {
    [booking, databasePayment] = await Promise.all([
      getDatabaseBookingRecord(bookingId),
      getDatabasePaymentSnapshot(bookingId),
    ]);
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Booking payment status database error", error);
      return NextResponse.json(
        {
          error: "PAYMENT_STATUS_FAILED",
          message: "Status pembayaran belum dapat dimuat.",
        },
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
        message: "Status pembayaran untuk pesanan ini tidak ditemukan.",
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

  const payment = databasePayment
    ? toSavedPaymentMethod(databasePayment, booking)
    : getSavedPaymentMethod(booking.id);
  const manualProof = databasePayment?.proofs[0]
    ? toManualPaymentProof(databasePayment, booking)
    : getManualPaymentProof(booking.id);
  const midtransSnapshot = getGatewaySnapshot(booking.id);
  const stripeSession = getStripeCheckoutSession(booking.id);
  const provider = databasePayment
    ? databasePayment.provider === "MANUAL"
      ? "MANUAL_TRANSFER"
      : databasePayment.provider
    : resolveProvider(payment, midtransSnapshot, stripeSession);
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
      villa: { id: booking.villaId, name: booking.villaName },
      stay: {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        guests: booking.guests,
      },
      guest: booking.guest,
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
        manualProofReviewedAt: manualProof?.reviewedAt ?? null,
        gatewayCreatedAt: midtransSnapshot?.createdAt ?? null,
        stripeSessionCreatedAt: stripeSession?.createdAt ?? null,
        expiresAt: booking.expiresAt,
      },
      nextAction,
    },
    meta: {
      source: "database",
      generatedAt: new Date().toISOString(),
    },
  });
}

function toSavedPaymentMethod(
  payment: NonNullable<Awaited<ReturnType<typeof getDatabasePaymentSnapshot>>>,
  booking: BookingStoreRecord,
): SavedBookingPaymentMethod | null {
  if (!payment.paymentMethod) return null;
  const method =
    paymentMethods.find((item) => item.id === payment.paymentMethod?.code) ?? {
      id: payment.paymentMethod.code,
      title: payment.paymentMethod.name,
      description: payment.paymentMethod.description ?? "Metode pembayaran tersimpan.",
      badge: "Aktif",
      eta: "Diproses",
      fee: payment.paymentMethod.fixedFee,
      accent: "emerald" as const,
    };
  return {
    id: payment.id,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    method,
    amount: payment.amount,
    depositAmount: booking.amounts.depositAmount,
    fee: payment.feeAmount,
    status: "METHOD_SELECTED",
    nextAction: {
      type:
        payment.paymentMethod.code === "bank-transfer"
          ? "MANUAL_CONFIRMATION"
          : "GATEWAY_REDIRECT",
      href:
        payment.paymentMethod.code === "bank-transfer"
          ? `/payment/manual?booking=${booking.bookingCode}`
          : `/payment/status?booking=${booking.bookingCode}`,
    },
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

function toManualPaymentProof(
  payment: NonNullable<Awaited<ReturnType<typeof getDatabasePaymentSnapshot>>>,
  booking: BookingStoreRecord,
): ManualPaymentProofRecord | null {
  const proof = payment.proofs[0];
  if (!proof) return null;
  const sender = readProviderPayload(payment.providerPayload);
  return {
    id: proof.id,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    senderName: sender.senderName || booking.guest.name,
    senderBank: sender.senderBank || payment.paymentMethod?.name || "Bank transfer",
    transferDate: sender.transferDate || proof.uploadedAt.toISOString().slice(0, 10),
    amount: payment.amount,
    note: sender.note || null,
    proof: {
      fileName: proof.fileName,
      fileType: proof.fileType,
      fileSize: proof.fileSize,
      mockUrl: proof.fileUrl,
    },
    status:
      proof.status === "PENDING" ? "WAITING_REVIEW" : proof.status,
    reviewerId: proof.reviewerId,
    reviewedAt: proof.reviewedAt?.toISOString() ?? null,
    rejectionReason: proof.rejectionReason,
    createdAt: proof.uploadedAt.toISOString(),
    updatedAt: proof.updatedAt.toISOString(),
  };
}

function readProviderPayload(value: unknown) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return { senderName: "", senderBank: "", transferDate: "", note: "" };
  }
  const payload = value as Record<string, unknown>;
  return {
    senderName: typeof payload.senderName === "string" ? payload.senderName : "",
    senderBank: typeof payload.senderBank === "string" ? payload.senderBank : "",
    transferDate:
      typeof payload.transferDate === "string" ? payload.transferDate : "",
    note: typeof payload.note === "string" ? payload.note : "",
  };
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
      href: `/payment/status?booking=${booking.bookingCode}`,
    };
  }

  if (booking.paymentStatus === "PARTIALLY_PAID") {
    return {
      type: "DEPOSIT_CONFIRMED",
      label: "Deposit sudah terverifikasi oleh Finance",
      href: `/payment/status?booking=${booking.bookingCode}`,
    };
  }

  if (booking.paymentStatus === "FAILED") {
    return {
      type: "RETRY_PAYMENT",
      label: "Pembayaran ditolak, unggah ulang bukti pembayaran",
      href: `/payment/manual?booking=${booking.bookingCode}`,
    };
  }

  if (booking.paymentStatus === "REFUNDED") {
    return {
      type: "REFUND_COMPLETED",
      label: "Refund telah diproses",
      href: `/payment/status?booking=${booking.bookingCode}`,
    };
  }

  if (!payment) {
    return {
      type: "PAYMENT_METHOD_REQUIRED",
      label: "Pilih metode pembayaran",
      href: `/payment?booking=${booking.bookingCode}`,
    };
  }

  if (payment.method.id === "bank-transfer") {
    if (manualProof?.status === "REJECTED") {
      return {
        type: "UPLOAD_MANUAL_PROOF",
        label: "Unggah ulang bukti transfer",
        href: `/payment/manual?booking=${booking.bookingCode}`,
      };
    }
    return manualProof
      ? {
          type: "WAITING_MANUAL_REVIEW",
          label: "Menunggu verifikasi Finance",
          href: `/payment/status?booking=${booking.bookingCode}`,
        }
      : {
          type: "UPLOAD_MANUAL_PROOF",
          label: "Unggah bukti transfer",
          href: `/payment/manual?booking=${booking.bookingCode}`,
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
