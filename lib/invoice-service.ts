import type {
  Booking,
  BookingLineItem,
  PaymentMethod,
  Villa,
} from "@prisma/client";
import {
  findBookingRecord,
  type BookingStoreRecord,
} from "@/lib/booking-store";
import {
  createInvoiceFileName,
  generateInvoicePdf,
  type InvoiceManualPaymentDetails,
  type InvoicePaymentDetails,
} from "@/lib/invoice-pdf";
import {
  getGatewaySnapshot,
  getManualPaymentProof,
  getSavedPaymentMethod,
  getStripeCheckoutSession,
} from "@/lib/payment-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

type DatabaseBooking = Booking & {
  villa: Pick<Villa, "id" | "name">;
  lineItems: BookingLineItem[];
  payments: Array<{
    id: string;
    provider: string;
    externalReference: string | null;
    amount: number;
    feeAmount: number;
    createdAt: Date;
    paymentMethod: Pick<PaymentMethod, "code" | "name"> | null;
    proofs: Array<{
      id: string;
      status: "PENDING" | "VERIFIED" | "REJECTED";
    }>;
  }>;
};

export type InvoiceDocument = {
  pdf: Uint8Array;
  fileName: string;
  bookingCode: string;
  source: "database" | "memory-fallback";
};

export async function createBookingInvoice(
  identifier: string,
): Promise<InvoiceDocument | null> {
  try {
    const stored = await prisma.booking.findFirst({
      where: { OR: [{ id: identifier }, { bookingCode: identifier }] },
      include: {
        villa: { select: { id: true, name: true } },
        lineItems: { orderBy: { createdAt: "asc" } },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            paymentMethod: { select: { code: true, name: true } },
            proofs: { orderBy: { uploadedAt: "desc" }, take: 1 },
          },
        },
      },
    });
    if (stored) return createDatabaseInvoice(stored as DatabaseBooking);
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) throw error;
  }

  const booking = findBookingRecord(identifier);
  return booking ? createMemoryInvoice(booking) : null;
}

function createDatabaseInvoice(booking: DatabaseBooking): InvoiceDocument {
  const normalized = normalizeDatabaseBooking(booking);
  const storedPayment = booking.payments[0] ?? null;
  const payment: InvoicePaymentDetails | null = storedPayment
    ? {
        method: {
          id:
            storedPayment.paymentMethod?.code ??
            storedPayment.provider.toLowerCase(),
          title: storedPayment.paymentMethod?.name ?? storedPayment.provider,
        },
        amount: storedPayment.amount,
        fee: storedPayment.feeAmount,
      }
    : null;
  const proof = storedPayment?.proofs[0];
  const manualConfirmation: InvoiceManualPaymentDetails | null = proof
    ? {
        id: proof.id,
        status: proof.status === "PENDING" ? "WAITING_REVIEW" : proof.status,
      }
    : null;
  const invoiceNumber =
    storedPayment?.externalReference ??
    (manualConfirmation?.id ? `INV-${manualConfirmation.id}` : undefined);
  const pdf = generateInvoicePdf({
    booking: normalized,
    payment,
    manualConfirmation,
    provider: storedPayment?.provider ?? null,
    invoiceNumber,
    issuedAt:
      storedPayment?.createdAt.toISOString() ?? booking.createdAt.toISOString(),
  });
  return {
    pdf,
    fileName: createInvoiceFileName(normalized),
    bookingCode: normalized.bookingCode,
    source: "database",
  };
}

function createMemoryInvoice(booking: BookingStoreRecord): InvoiceDocument {
  const payment = getSavedPaymentMethod(booking.id);
  const manualConfirmation = getManualPaymentProof(booking.id);
  const stripeSession = getStripeCheckoutSession(booking.id);
  const gatewaySnapshot = getGatewaySnapshot(booking.id);
  const pdf = generateInvoicePdf({
    booking,
    payment,
    manualConfirmation,
    stripeSession,
    provider: stripeSession
      ? "STRIPE"
      : gatewaySnapshot
        ? "MIDTRANS"
        : payment?.method.id === "bank-transfer"
          ? "MANUAL_TRANSFER"
          : "PAYMENT_GATEWAY",
  });
  return {
    pdf,
    fileName: createInvoiceFileName(booking),
    bookingCode: booking.bookingCode,
    source: "memory-fallback",
  };
}

function normalizeDatabaseBooking(
  booking: DatabaseBooking,
): BookingStoreRecord {
  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    villaId: booking.villaId,
    villaName: booking.villa.name,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    nights: booking.nights,
    guests: booking.guests,
    guest: {
      name: booking.guestName,
      email: booking.guestEmail,
      phone: booking.guestPhone,
    },
    specialRequest: booking.specialRequest,
    coupon: {
      code: null,
      status: "NOT_APPLIED",
      amount: booking.discountTotal,
    },
    addOns: [],
    lineItems: booking.lineItems.map((item) => ({
      code: item.id,
      type: item.type,
      label: item.label,
      amount: item.totalAmount,
    })),
    availabilityLocks: [],
    amounts: {
      subtotal: booking.subtotal,
      extraGuestFee: booking.extraGuestFee,
      addonTotal: booking.addonTotal,
      discountTotal: booking.discountTotal,
      serviceFee: booking.serviceFee,
      taxTotal: booking.taxTotal,
      totalAmount: booking.totalAmount,
      depositAmount: booking.depositAmount,
      remainingAmount: booking.remainingAmount,
      currency: "IDR",
    },
    expiresAt: booking.expiresAt?.toISOString() ?? "",
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}
