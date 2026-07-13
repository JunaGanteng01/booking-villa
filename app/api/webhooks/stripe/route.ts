import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getBookingByCode,
  getBookingById,
  updateBookingPaymentState,
  type BookingStoreRecord,
} from "@/lib/booking-store";
import {
  getStripeCheckoutSessionBySessionId,
  updateStripeCheckoutSessionPaymentStatus,
  type StripeCheckoutSessionRecord,
} from "@/lib/payment-store";

type StripeWebhookEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: StripeWebhookObject;
  };
};

type StripeWebhookObject = {
  id?: string;
  object?: string;
  status?: string;
  payment_status?: string;
  amount_total?: number;
  amount_received?: number;
  currency?: string;
  client_reference_id?: string;
  metadata?: {
    bookingId?: string;
    bookingCode?: string;
    [key: string]: string | undefined;
  };
};

type StripeMappedStatus = {
  label: "PAID" | "PENDING" | "FAILED" | "EXPIRED" | "REFUNDED" | "UNKNOWN";
  bookingState: {
    status: BookingStoreRecord["status"];
    paymentStatus: BookingStoreRecord["paymentStatus"];
  };
  stripePaymentStatus: StripeCheckoutSessionRecord["paymentStatus"];
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureValidation = validateSignature(
    rawBody,
    request.headers.get("stripe-signature"),
  );

  if (!signatureValidation.ok) {
    return NextResponse.json(
      {
        error: "INVALID_SIGNATURE",
        message: signatureValidation.message,
      },
      { status: 401 },
    );
  }

  let event: StripeWebhookEvent;

  try {
    event = JSON.parse(rawBody) as StripeWebhookEvent;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Body webhook Stripe harus JSON valid.",
      },
      { status: 400 },
    );
  }

  const eventType = normalizeString(event.type);
  const stripeObject = event.data?.object ?? {};
  const booking = findBookingFromStripeObject(stripeObject);

  if (!eventType) {
    return NextResponse.json(
      {
        error: "EVENT_TYPE_REQUIRED",
        message: "type wajib ada pada payload Stripe.",
      },
      { status: 400 },
    );
  }

  if (!booking) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Booking untuk payload Stripe ini tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const mappedStatus = mapStripeEvent(eventType, stripeObject);
  const updatedBooking = updateBookingPaymentState(booking.id, mappedStatus.bookingState);
  const updatedSession = updateStripeCheckoutSessionPaymentStatus(
    booking.id,
    mappedStatus.stripePaymentStatus,
  );

  return NextResponse.json({
    data: {
      received: true,
      provider: "STRIPE",
      eventId: normalizeString(event.id) || null,
      eventType,
      objectId: normalizeString(stripeObject.id) || null,
      paymentStatus: normalizeString(stripeObject.payment_status) || null,
      objectStatus: normalizeString(stripeObject.status) || null,
      mappedStatus: mappedStatus.label,
      booking: updatedBooking,
      stripeSession: updatedSession,
    },
    meta: {
      source: "mock-store",
      signature: signatureValidation.mode,
    },
  });
}

function validateSignature(rawBody: string, signatureHeader: string | null) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      ok: true as const,
      mode: "skipped-no-webhook-secret",
    };
  }

  if (!signatureHeader) {
    return {
      ok: false as const,
      message: "stripe-signature wajib ada saat STRIPE_WEBHOOK_SECRET dikonfigurasi.",
    };
  }

  const signatureParts = parseSignatureHeader(signatureHeader);
  const timestamp = signatureParts.t?.[0];
  const signatures = signatureParts.v1 ?? [];

  if (!timestamp || signatures.length === 0) {
    return {
      ok: false as const,
      message: "stripe-signature tidak memiliki timestamp atau signature v1.",
    };
  }

  const timestampInSeconds = Number(timestamp);
  if (!Number.isFinite(timestampInSeconds)) {
    return {
      ok: false as const,
      message: "Timestamp stripe-signature tidak valid.",
    };
  }

  const ageInSeconds = Math.abs(Date.now() / 1000 - timestampInSeconds);
  if (ageInSeconds > 300) {
    return {
      ok: false as const,
      message: "stripe-signature sudah kedaluwarsa.",
    };
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
  const isValid = signatures.some((signature) => safeEqualHex(signature, expected));

  return isValid
    ? { ok: true as const, mode: "verified" }
    : { ok: false as const, message: "stripe-signature tidak valid." };
}

function parseSignatureHeader(signatureHeader: string) {
  return signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return acc;

    acc[key] = [...(acc[key] ?? []), value];
    return acc;
  }, {});
}

function safeEqualHex(a: string, b: string) {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b) || a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

function findBookingFromStripeObject(stripeObject: StripeWebhookObject) {
  const metadata = stripeObject.metadata ?? {};
  const metadataBookingId = normalizeString(metadata.bookingId);
  const metadataBookingCode = normalizeString(metadata.bookingCode);
  const clientReferenceId = normalizeString(stripeObject.client_reference_id);
  const objectId = normalizeString(stripeObject.id);
  const checkoutSession = objectId ? getStripeCheckoutSessionBySessionId(objectId) : null;

  return (
    (metadataBookingId ? getBookingById(metadataBookingId) : null) ??
    (metadataBookingCode ? getBookingByCode(metadataBookingCode) : null) ??
    (clientReferenceId ? getBookingByCode(clientReferenceId) : null) ??
    (checkoutSession ? getBookingById(checkoutSession.bookingId) : null)
  );
}

function mapStripeEvent(eventType: string, stripeObject: StripeWebhookObject): StripeMappedStatus {
  const paymentStatus = normalizeString(stripeObject.payment_status);
  const objectStatus = normalizeString(stripeObject.status);

  if (
    eventType === "checkout.session.completed" ||
    eventType === "checkout.session.async_payment_succeeded" ||
    eventType === "payment_intent.succeeded"
  ) {
    if (paymentStatus === "unpaid" || objectStatus === "open") {
      return {
        label: "PENDING",
        bookingState: {
          status: "WAITING_PAYMENT",
          paymentStatus: "UNPAID",
        },
        stripePaymentStatus: "unpaid",
      };
    }

    return {
      label: "PAID",
      bookingState: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
      stripePaymentStatus: "paid",
    };
  }

  if (
    eventType === "checkout.session.async_payment_failed" ||
    eventType === "payment_intent.payment_failed"
  ) {
    return {
      label: "FAILED",
      bookingState: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
      },
      stripePaymentStatus: "failed",
    };
  }

  if (eventType === "checkout.session.expired") {
    return {
      label: "EXPIRED",
      bookingState: {
        status: "EXPIRED",
        paymentStatus: "UNPAID",
      },
      stripePaymentStatus: "failed",
    };
  }

  if (eventType === "charge.refunded" || eventType === "refund.created") {
    return {
      label: "REFUNDED",
      bookingState: {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
      },
      stripePaymentStatus: "refunded",
    };
  }

  return {
    label: "UNKNOWN",
    bookingState: {
      status: "WAITING_PAYMENT",
      paymentStatus: "UNPAID",
    },
    stripePaymentStatus: "unpaid",
  };
}

function normalizeString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}
