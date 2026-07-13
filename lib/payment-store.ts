import { paymentMethods, type PaymentMethod } from "@/lib/booking-draft";
import type { BookingStoreRecord } from "@/lib/booking-store";

export type SavedBookingPaymentMethod = {
  id: string;
  bookingId: string;
  bookingCode: string;
  method: PaymentMethod;
  amount: number;
  depositAmount: number;
  fee: number;
  status: "METHOD_SELECTED";
  nextAction: {
    type: "MANUAL_CONFIRMATION" | "GATEWAY_REDIRECT";
    href: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ManualPaymentProofRecord = {
  id: string;
  bookingId: string;
  bookingCode: string;
  senderName: string;
  senderBank: string;
  transferDate: string;
  amount: number;
  note: string | null;
  proof: {
    fileName: string;
    fileType: string;
    fileSize: number;
    mockUrl: string;
  };
  status: "WAITING_REVIEW";
  createdAt: string;
  updatedAt: string;
};

export type GatewaySnapshotRecord = {
  id: string;
  bookingId: string;
  bookingCode: string;
  provider: "MIDTRANS";
  token: string;
  redirectUrl: string;
  amount: number;
  status: "SNAPSHOT_CREATED";
  payload: {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    customer_details: {
      first_name: string;
      email: string;
      phone: string;
    };
    item_details: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    callbacks: {
      finish: string;
      error: string;
      pending: string;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export type StripeCheckoutSessionRecord = {
  id: string;
  bookingId: string;
  bookingCode: string;
  provider: "STRIPE";
  sessionId: string;
  url: string;
  amount: number;
  currency: "idr";
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  payload: {
    mode: "payment";
    success_url: string;
    cancel_url: string;
    client_reference_id: string;
    customer_email: string;
    line_items: Array<{
      quantity: number;
      price_data: {
        currency: "idr";
        unit_amount: number;
        product_data: {
          name: string;
          description?: string;
        };
      };
    }>;
    metadata: {
      bookingId: string;
      bookingCode: string;
    };
  };
  createdAt: string;
  updatedAt: string;
};

const savedPaymentMethods = new Map<string, SavedBookingPaymentMethod>();
const manualPaymentProofs = new Map<string, ManualPaymentProofRecord>();
const gatewaySnapshots = new Map<string, GatewaySnapshotRecord>();
const stripeCheckoutSessions = new Map<string, StripeCheckoutSessionRecord>();

export function getPaymentMethodById(methodId: string) {
  return (
    paymentMethods.find(
      (method) =>
        method.id.toLowerCase() === methodId.toLowerCase() ||
        method.title.toLowerCase() === methodId.toLowerCase(),
    ) ?? null
  );
}

export function savePaymentMethodForBooking(
  booking: BookingStoreRecord,
  method: PaymentMethod,
) {
  const now = new Date().toISOString();
  const fee = method.fee;
  const amount = booking.amounts.depositAmount + fee;
  const record: SavedBookingPaymentMethod = {
    id: `payment_${booking.bookingCode.toLowerCase()}`,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    method,
    amount,
    depositAmount: booking.amounts.depositAmount,
    fee,
    status: "METHOD_SELECTED",
    nextAction:
      method.id === "bank-transfer"
        ? {
            type: "MANUAL_CONFIRMATION",
            href: `/api/bookings/${booking.id}/payment-confirmation/manual`,
          }
        : {
            type: "GATEWAY_REDIRECT",
            href: `/api/bookings/${booking.id}/payment-gateway/session`,
          },
    createdAt: savedPaymentMethods.get(booking.id)?.createdAt ?? now,
    updatedAt: now,
  };

  savedPaymentMethods.set(booking.id, record);
  return record;
}

export function getSavedPaymentMethod(bookingId: string) {
  return savedPaymentMethods.get(bookingId) ?? null;
}

export function saveManualPaymentProof({
  booking,
  senderName,
  senderBank,
  transferDate,
  amount,
  note,
  proof,
}: {
  booking: BookingStoreRecord;
  senderName: string;
  senderBank: string;
  transferDate: string;
  amount: number;
  note: string | null;
  proof: {
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}) {
  const now = new Date().toISOString();
  const id = `proof_${booking.bookingCode.toLowerCase()}`;
  const record: ManualPaymentProofRecord = {
    id,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    senderName,
    senderBank,
    transferDate,
    amount,
    note,
    proof: {
      ...proof,
      mockUrl: `/uploads/payment-proofs/${id}/${encodeURIComponent(proof.fileName)}`,
    },
    status: "WAITING_REVIEW",
    createdAt: manualPaymentProofs.get(booking.id)?.createdAt ?? now,
    updatedAt: now,
  };

  manualPaymentProofs.set(booking.id, record);
  return record;
}

export function getManualPaymentProof(bookingId: string) {
  return manualPaymentProofs.get(bookingId) ?? null;
}

export function createGatewaySnapshot(booking: BookingStoreRecord, payment: SavedBookingPaymentMethod) {
  const now = new Date().toISOString();
  const token = `mock-snap-${booking.bookingCode.toLowerCase()}-${Date.now().toString(36)}`;
  const record: GatewaySnapshotRecord = {
    id: `gateway_${booking.bookingCode.toLowerCase()}`,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    provider: "MIDTRANS",
    token,
    redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${token}`,
    amount: payment.amount,
    status: "SNAPSHOT_CREATED",
    payload: {
      transaction_details: {
        order_id: booking.bookingCode,
        gross_amount: payment.amount,
      },
      customer_details: {
        first_name: booking.guest.name,
        email: booking.guest.email,
        phone: booking.guest.phone,
      },
      item_details: [
        {
          id: "deposit",
          price: booking.amounts.depositAmount,
          quantity: 1,
          name: `Deposit ${booking.villaName}`,
        },
        ...(payment.fee > 0
          ? [
              {
                id: "payment_fee",
                price: payment.fee,
                quantity: 1,
                name: `Fee ${payment.method.title}`,
              },
            ]
          : []),
      ],
      callbacks: {
        finish: `/payment/status?booking=${booking.id}`,
        error: `/payment/status?booking=${booking.id}&status=error`,
        pending: `/payment/status?booking=${booking.id}&status=pending`,
      },
    },
    createdAt: gatewaySnapshots.get(booking.id)?.createdAt ?? now,
    updatedAt: now,
  };

  gatewaySnapshots.set(booking.id, record);
  return record;
}

export function getGatewaySnapshot(bookingId: string) {
  return gatewaySnapshots.get(bookingId) ?? null;
}

export function createStripeCheckoutSession(
  booking: BookingStoreRecord,
  payment: SavedBookingPaymentMethod,
) {
  const now = new Date().toISOString();
  const sessionId = `cs_test_${booking.bookingCode.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now().toString(36)}`;
  const record: StripeCheckoutSessionRecord = {
    id: `stripe_${booking.bookingCode.toLowerCase()}`,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    provider: "STRIPE",
    sessionId,
    url: `https://checkout.stripe.com/c/pay/${sessionId}`,
    amount: payment.amount,
    currency: "idr",
    paymentStatus: "unpaid",
    payload: {
      mode: "payment",
      success_url: `/payment/status?booking=${booking.id}&provider=stripe&status=success`,
      cancel_url: `/payment?booking=${booking.id}&provider=stripe&status=cancel`,
      client_reference_id: booking.bookingCode,
      customer_email: booking.guest.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "idr",
            unit_amount: payment.amount,
            product_data: {
              name: `Deposit ${booking.villaName}`,
              description: `Booking ${booking.bookingCode}`,
            },
          },
        },
      ],
      metadata: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
      },
    },
    createdAt: stripeCheckoutSessions.get(booking.id)?.createdAt ?? now,
    updatedAt: now,
  };

  stripeCheckoutSessions.set(booking.id, record);
  return record;
}

export function getStripeCheckoutSession(bookingId: string) {
  return stripeCheckoutSessions.get(bookingId) ?? null;
}

export function getStripeCheckoutSessionBySessionId(sessionId: string) {
  const normalizedSessionId = sessionId.toLowerCase();

  return (
    Array.from(stripeCheckoutSessions.values()).find(
      (session) => session.sessionId.toLowerCase() === normalizedSessionId,
    ) ?? null
  );
}

export function updateStripeCheckoutSessionPaymentStatus(
  bookingId: string,
  paymentStatus: StripeCheckoutSessionRecord["paymentStatus"],
) {
  const session = stripeCheckoutSessions.get(bookingId);
  if (!session) return null;

  const updated: StripeCheckoutSessionRecord = {
    ...session,
    paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  stripeCheckoutSessions.set(bookingId, updated);
  return updated;
}
