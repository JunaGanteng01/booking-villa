import { Prisma } from "@prisma/client";
import type { BookingStoreRecord } from "@/lib/booking-store";
import { prisma } from "@/lib/prisma";
import type { Villa } from "@/lib/villa-data";

const bookingInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
  villa: { select: { id: true, name: true } },
  coupon: { select: { code: true } },
  lineItems: { orderBy: { createdAt: "asc" as const } },
  availabilityLocks: { orderBy: { date: "asc" as const } },
} satisfies Prisma.BookingInclude;

type DatabaseBooking = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

export class BookingPaymentFlowError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 409,
  ) {
    super(message);
    this.name = "BookingPaymentFlowError";
  }
}

export async function persistBookingRecord(
  record: BookingStoreRecord,
  villa: Villa,
) {
  return prisma.$transaction(async (tx) => {
    const category = await tx.category.upsert({
      where: { slug: villa.category.toLowerCase() },
      create: {
        name: villa.category,
        slug: villa.category.toLowerCase(),
        description: `Koleksi villa ${villa.category} VillaKu.`,
      },
      update: { name: villa.category, isActive: true },
    });

    const databaseVilla = await tx.villa.upsert({
      where: { slug: villa.id },
      create: {
        id: villa.id,
        categoryId: category.id,
        slug: villa.id,
        name: villa.name,
        shortDescription: villa.highlight,
        description: villa.description,
        location: villa.location,
        address: villa.address,
        pricePerNight: villa.price,
        capacity: villa.guests,
        bedrooms: villa.bedrooms,
        bathrooms: villa.bathrooms,
        sizeSqm: parseSize(villa.size),
        ratingAverage: villa.rating,
        reviewCount: villa.reviews,
        status: "PUBLISHED",
        isFeatured: villa.rating >= 4.9,
        publishedAt: new Date(),
      },
      update: {
        categoryId: category.id,
        name: villa.name,
        shortDescription: villa.highlight,
        description: villa.description,
        location: villa.location,
        address: villa.address,
        pricePerNight: villa.price,
        capacity: villa.guests,
        bedrooms: villa.bedrooms,
        bathrooms: villa.bathrooms,
        sizeSqm: parseSize(villa.size),
        ratingAverage: villa.rating,
        reviewCount: villa.reviews,
        status: "PUBLISHED",
      },
    });

    const cover = await tx.villaImage.findFirst({
      where: { villaId: databaseVilla.id, isCover: true },
      select: { id: true },
    });
    if (!cover) {
      await tx.villaImage.create({
        data: {
          villaId: databaseVilla.id,
          url: villa.image,
          alt: villa.name,
          isCover: true,
        },
      });
    }

    let user = record.bookedBy?.userId
      ? await tx.user.findUnique({
          where: { id: record.bookedBy.userId },
          select: { id: true },
        })
      : null;
    if (!user && record.bookedBy?.email) {
      user = await tx.user.findUnique({
        where: { email: record.bookedBy.email.toLowerCase() },
        select: { id: true },
      });
    }
    if (!user) {
      user = await tx.user.findUnique({
        where: { email: record.guest.email.toLowerCase() },
        select: { id: true },
      });
    }
    const existing = await tx.booking.findUnique({
      where: { bookingCode: record.bookingCode },
      select: { id: true },
    });

    const booking = existing
      ? await tx.booking.findUniqueOrThrow({
          where: { id: existing.id },
        })
      : await tx.booking.create({
          data: {
            id: record.id,
            bookingCode: record.bookingCode,
            userId: user?.id ?? null,
            villaId: databaseVilla.id,
            status: record.status,
            paymentStatus: record.paymentStatus,
            checkIn: dateOnly(record.checkIn),
            checkOut: dateOnly(record.checkOut),
            nights: record.nights,
            guests: record.guests,
            guestName: record.guest.name,
            guestEmail: record.guest.email,
            guestPhone: record.guest.phone,
            specialRequest: record.specialRequest,
            subtotal: record.amounts.subtotal,
            extraGuestFee: record.amounts.extraGuestFee,
            addonTotal: record.amounts.addonTotal,
            discountTotal: record.amounts.discountTotal,
            serviceFee: record.amounts.serviceFee,
            taxTotal: record.amounts.taxTotal,
            totalAmount: record.amounts.totalAmount,
            depositAmount: record.amounts.depositAmount,
            remainingAmount: record.amounts.remainingAmount,
            currency: record.amounts.currency,
            source: "website",
            expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
            createdAt: new Date(record.createdAt),
            lineItems: {
              create: record.lineItems.map((item) => ({
                type: normalizeLineItemType(item.type),
                label: item.label,
                unitAmount: item.amount,
                totalAmount: item.amount,
                metadata: { code: item.code },
              })),
            },
          },
        });

    if (!existing) {
      for (const lock of record.availabilityLocks) {
        await tx.villaAvailability.upsert({
          where: {
            villaId_date: {
              villaId: databaseVilla.id,
              date: dateOnly(lock.date),
            },
          },
          create: {
            villaId: databaseVilla.id,
            bookingId: booking.id,
            date: dateOnly(lock.date),
            status: normalizeAvailabilityStatus(lock.status),
            holdExpiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
          },
          update: {
            bookingId: booking.id,
            status: normalizeAvailabilityStatus(lock.status),
            holdExpiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
          },
        });
      }
    }

    const payment = await tx.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!payment) {
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          provider: "MOCK",
          status: "PENDING",
          externalReference: `PENDING-${record.bookingCode}`,
          amount: record.amounts.depositAmount,
          currency: record.amounts.currency,
          expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
        },
      });
    }

    return tx.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: bookingInclude,
    });
  });
}

export async function listDatabaseBookingRecords() {
  const bookings = await prisma.booking.findMany({
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
  return bookings.map(toBookingStoreRecord);
}

export async function getDatabaseBookingRecord(identifier: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id: identifier }, { bookingCode: identifier }],
    },
    include: bookingInclude,
  });
  return booking ? toBookingStoreRecord(booking) : null;
}

export async function saveDatabasePaymentMethod({
  bookingIdentifier,
  method,
}: {
  bookingIdentifier: string;
  method: {
    id: string;
    title: string;
    description: string;
    fee: number;
  };
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        OR: [{ id: bookingIdentifier }, { bookingCode: bookingIdentifier }],
      },
      select: {
        id: true,
        bookingCode: true,
        status: true,
        paymentStatus: true,
        depositAmount: true,
        remainingAmount: true,
        totalAmount: true,
      },
    });
    if (!booking) return null;
    if (["CHECKED_IN", "CANCELLED", "COMPLETED", "EXPIRED", "REFUNDED"].includes(booking.status)) {
      throw new BookingPaymentFlowError(
        "BOOKING_NOT_PAYABLE",
        "Booking ini tidak lagi dapat menerima pembayaran.",
      );
    }
    if (booking.paymentStatus === "PAID" || booking.paymentStatus === "REFUNDED") {
      throw new BookingPaymentFlowError(
        "BOOKING_ALREADY_SETTLED",
        "Pembayaran booking ini sudah selesai.",
      );
    }

    const pendingProof = await tx.paymentProof.findFirst({
      where: { payment: { bookingId: booking.id }, status: "PENDING" },
      select: { id: true },
    });
    if (pendingProof) {
      throw new BookingPaymentFlowError(
        "PAYMENT_PROOF_PENDING",
        "Metode pembayaran tidak dapat diubah saat bukti transfer sedang diverifikasi Finance.",
      );
    }

    const config = paymentMethodConfig(method.id);
    const paymentMethod = await tx.paymentMethod.upsert({
      where: { code: method.id },
      create: {
        code: method.id,
        name: method.title,
        type: config.type,
        provider: config.provider,
        description: method.description,
        fixedFee: method.fee,
        requiresProof: method.id === "bank-transfer",
        isActive: true,
      },
      update: {
        name: method.title,
        type: config.type,
        provider: config.provider,
        description: method.description,
        fixedFee: method.fee,
        requiresProof: method.id === "bank-transfer",
        isActive: true,
      },
    });
    const current = await tx.payment.findFirst({
      where: {
        bookingId: booking.id,
        status: { in: ["PENDING", "REQUIRES_ACTION", "FAILED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    const principal =
      booking.paymentStatus === "PARTIALLY_PAID"
        ? booking.remainingAmount
        : booking.depositAmount || booking.totalAmount;
    if (principal <= 0) {
      throw new BookingPaymentFlowError(
        "BOOKING_ALREADY_SETTLED",
        "Tidak ada sisa tagihan yang perlu dibayar.",
      );
    }
    const amount = principal + method.fee;
    const payment = current
      ? await tx.payment.update({
          where: { id: current.id },
          data: {
            paymentMethodId: paymentMethod.id,
            provider: config.provider,
            status:
              method.id === "bank-transfer" ? "PENDING" : "REQUIRES_ACTION",
            amount,
            feeAmount: method.fee,
            paidAt: null,
            failedAt: null,
          },
        })
      : await tx.payment.create({
          data: {
            bookingId: booking.id,
            paymentMethodId: paymentMethod.id,
            provider: config.provider,
            status:
              method.id === "bank-transfer" ? "PENDING" : "REQUIRES_ACTION",
            externalReference: `PAY-${booking.bookingCode}-${Date.now()}`,
            amount,
            feeAmount: method.fee,
            currency: "IDR",
          },
        });

    if (booking.paymentStatus === "FAILED") {
      await tx.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "UNPAID" },
      });
    }
    return payment;
  });
}

export async function saveDatabaseManualPaymentProof({
  bookingIdentifier,
  senderName,
  senderBank,
  transferDate,
  amount,
  note,
  proof,
}: {
  bookingIdentifier: string;
  senderName: string;
  senderBank: string;
  transferDate: string;
  amount: number;
  note: string | null;
  proof: { fileName: string; fileType: string; fileSize: number };
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        OR: [{ id: bookingIdentifier }, { bookingCode: bookingIdentifier }],
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
      },
    });
    if (!booking) return null;
    if (["CHECKED_IN", "CANCELLED", "COMPLETED", "EXPIRED", "REFUNDED"].includes(booking.status)) {
      throw new BookingPaymentFlowError(
        "BOOKING_NOT_PAYABLE",
        "Booking ini tidak lagi dapat menerima pembayaran.",
      );
    }
    if (booking.paymentStatus === "PAID" || booking.paymentStatus === "REFUNDED") {
      throw new BookingPaymentFlowError(
        "BOOKING_ALREADY_SETTLED",
        "Pembayaran booking ini sudah selesai.",
      );
    }

    const pendingProof = await tx.paymentProof.findFirst({
      where: {
        payment: { bookingId: booking.id },
        status: "PENDING",
      },
      select: { id: true },
    });
    if (pendingProof) {
      throw new BookingPaymentFlowError(
        "PAYMENT_PROOF_PENDING",
        "Bukti pembayaran sebelumnya masih menunggu verifikasi Finance.",
      );
    }

    const payment = await tx.payment.findFirst({
      where: { bookingId: booking.id },
      include: {
        paymentMethod: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) return null;
    if (payment.paymentMethod?.code !== "bank-transfer") {
      throw new BookingPaymentFlowError(
        "PAYMENT_METHOD_NOT_MANUAL",
        "Bukti transfer hanya dapat diunggah untuk metode bank transfer.",
      );
    }
    if (amount <= payment.feeAmount) {
      throw new BookingPaymentFlowError(
        "INVALID_PAYMENT_AMOUNT",
        "Nominal transfer harus lebih besar daripada biaya pembayaran.",
        400,
      );
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        provider: "MANUAL",
        status: "PENDING",
        amount,
        paidAt: null,
        failedAt: null,
        providerPayload: {
          senderName,
          senderBank,
          transferDate,
          note,
        },
      },
    });
    const paidPayments = await tx.payment.findMany({
      where: { bookingId: booking.id, status: "PAID" },
      select: { amount: true, feeAmount: true },
    });
    const paidPrincipal = paidPayments.reduce(
      (total, item) => total + Math.max(item.amount - item.feeAmount, 0),
      0,
    );
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: paidPrincipal > 0 ? "PARTIALLY_PAID" : "UNPAID",
        remainingAmount: Math.max(
          booking.totalAmount - paidPrincipal,
          0,
        ),
      },
    });
    const createdProof = await tx.paymentProof.create({
      data: {
        paymentId: updatedPayment.id,
        status: "PENDING",
        fileUrl: `mock://payment-proofs/${encodeURIComponent(proof.fileName)}`,
        fileName: proof.fileName,
        fileType: proof.fileType,
        fileSize: Math.round(proof.fileSize),
      },
    });
    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        providerEventId: `manual-proof-${createdProof.id}`,
        eventType: "manual.payment.proof_uploaded",
        payload: {
          bookingId: booking.id,
          paymentProofId: createdProof.id,
          senderName,
          senderBank,
          transferDate,
          amount,
        },
        processedAt: new Date(),
      },
    });
    return createdProof;
  });
}

export async function getDatabasePaymentSelection(bookingIdentifier: string) {
  return prisma.payment.findFirst({
    where: {
      booking: {
        OR: [{ id: bookingIdentifier }, { bookingCode: bookingIdentifier }],
      },
    },
    include: {
      paymentMethod: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDatabasePaymentSnapshot(bookingIdentifier: string) {
  return prisma.payment.findFirst({
    where: {
      booking: {
        OR: [{ id: bookingIdentifier }, { bookingCode: bookingIdentifier }],
      },
    },
    include: {
      paymentMethod: {
        select: {
          code: true,
          name: true,
          description: true,
          fixedFee: true,
        },
      },
      proofs: {
        orderBy: { uploadedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

function toBookingStoreRecord(booking: DatabaseBooking): BookingStoreRecord {
  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    bookedBy: booking.user
      ? {
          userId: booking.user.id,
          name: booking.user.name || booking.guestName,
          email: booking.user.email,
          role: booking.user.role,
        }
      : undefined,
    villaId: booking.villa.id,
    villaName: booking.villa.name,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    checkIn: formatDateOnly(booking.checkIn),
    checkOut: formatDateOnly(booking.checkOut),
    nights: booking.nights,
    guests: booking.guests,
    guest: {
      name: booking.guestName,
      email: booking.guestEmail,
      phone: booking.guestPhone,
    },
    specialRequest: booking.specialRequest,
    coupon: {
      code: booking.coupon?.code ?? null,
      status: booking.coupon ? "applied" : "empty",
      amount: booking.discountTotal,
    },
    addOns: booking.lineItems
      .filter((item) => item.type === "ADD_ON")
      .map((item) => ({ id: item.id, label: item.label, price: item.totalAmount })),
    lineItems: booking.lineItems.map((item) => ({
      code: readMetadataCode(item.metadata) || item.id,
      type: item.type,
      label: item.label,
      amount: item.totalAmount,
    })),
    availabilityLocks: booking.availabilityLocks.map((lock) => ({
      date: formatDateOnly(lock.date),
      status: lock.status,
    })),
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

function paymentMethodConfig(id: string) {
  if (id === "bank-transfer") return { type: "BANK_TRANSFER" as const, provider: "MANUAL" as const };
  if (id === "virtual-account") return { type: "VIRTUAL_ACCOUNT" as const, provider: "MIDTRANS" as const };
  if (id === "credit-card") return { type: "CREDIT_CARD" as const, provider: "STRIPE" as const };
  if (id === "qris") return { type: "QRIS" as const, provider: "MIDTRANS" as const };
  return { type: "E_WALLET" as const, provider: "MIDTRANS" as const };
}

function normalizeLineItemType(value: string) {
  const allowed = ["ROOM", "EXTRA_GUEST", "ADD_ON", "DISCOUNT", "SERVICE_FEE", "TAX", "PAYMENT_FEE"] as const;
  return allowed.find((item) => item === value) ?? "ROOM";
}

function normalizeAvailabilityStatus(value: string) {
  const allowed = ["AVAILABLE", "BOOKED", "PENDING", "MAINTENANCE", "BLOCKED"] as const;
  return allowed.find((item) => item === value) ?? "PENDING";
}

function parseSize(value: string) {
  const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function readMetadataCode(value: Prisma.JsonValue | null) {
  if (!value || Array.isArray(value) || typeof value !== "object") return "";
  return typeof value.code === "string" ? value.code : "";
}
