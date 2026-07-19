import { Prisma, type CheckoutChannel, type CheckoutStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const checkoutInclude = {
  user: { select: { id: true, name: true, email: true } },
  villa: {
    select: {
      id: true,
      name: true,
      location: true,
      images: {
        where: { isCover: true },
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: { url: true },
      },
    },
  },
  checkout: {
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      processedBy: { select: { id: true, name: true, email: true } },
      events: {
        orderBy: { createdAt: "desc" as const },
        include: { actor: { select: { id: true, name: true, email: true } } },
      },
    },
  },
} satisfies Prisma.BookingInclude;

type CheckoutBooking = Prisma.BookingGetPayload<{ include: typeof checkoutInclude }>;

export class CheckoutFlowError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 409,
  ) {
    super(message);
    this.name = "CheckoutFlowError";
  }
}

export async function listUserCheckoutBookings(userId: string) {
  const records = await prisma.booking.findMany({
    where: { userId },
    include: checkoutInclude,
    orderBy: { createdAt: "desc" },
  });

  return records.map(serializeCheckoutBooking);
}

export async function getCheckoutBooking(identifier: string) {
  const record = await prisma.booking.findFirst({
    where: { OR: [{ id: identifier }, { bookingCode: identifier }] },
    include: checkoutInclude,
  });
  return record ? serializeCheckoutBooking(record) : null;
}

export async function listReceptionCheckoutBookings() {
  const records = await prisma.booking.findMany({
    where: {
      OR: [
        { status: "CONFIRMED" },
        { checkout: { is: { status: { in: ["CHECKOUT_REQUESTED", "CHECKED_OUT"] } } } },
      ],
    },
    include: checkoutInclude,
    orderBy: [{ checkout: { requestedAt: "desc" } }, { checkOut: "asc" }],
  });

  return records
    .filter((record) => isActiveStay(record) || record.checkout !== null)
    .map(serializeCheckoutBooking);
}

export async function requestWebsiteCheckout({
  bookingIdentifier,
  userId,
  notes,
}: {
  bookingIdentifier: string;
  userId: string;
  notes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { OR: [{ id: bookingIdentifier }, { bookingCode: bookingIdentifier }] },
      include: { checkout: true },
    });
    if (!booking) {
      throw new CheckoutFlowError("BOOKING_NOT_FOUND", "Booking tidak ditemukan.", 404);
    }
    if (booking.userId !== userId) {
      throw new CheckoutFlowError(
        "FORBIDDEN",
        "Anda hanya dapat mengajukan checkout untuk booking sendiri.",
        403,
      );
    }
    if (booking.checkout?.status === "CHECKED_OUT" || booking.status === "COMPLETED") {
      throw new CheckoutFlowError("ALREADY_CHECKED_OUT", "Booking ini sudah checkout.");
    }
    if (booking.checkout?.status === "CHECKOUT_REQUESTED") {
      return tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: checkoutInclude,
      });
    }
    if (!isActiveStay(booking)) {
      throw new CheckoutFlowError(
        "STAY_NOT_ACTIVE",
        "Checkout hanya dapat diajukan saat masa menginap aktif.",
      );
    }

    const actor = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!actor) {
      throw new CheckoutFlowError("USER_NOT_FOUND", "Akun user tidak ditemukan.", 404);
    }

    const now = new Date();
    const checkout = await tx.checkout.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        status: "CHECKOUT_REQUESTED",
        channel: "WEBSITE",
        requestedById: actor.id,
        requestedAt: now,
        notes: normalizeNotes(notes),
      },
      update: {
        status: "CHECKOUT_REQUESTED",
        channel: "WEBSITE",
        requestedById: actor.id,
        requestedAt: now,
        notes: normalizeNotes(notes),
      },
    });

    await tx.checkoutEvent.create({
      data: {
        checkoutId: checkout.id,
        actorId: actor.id,
        fromStatus: "ACTIVE",
        toStatus: "CHECKOUT_REQUESTED",
        eventType: "WEBSITE_CHECKOUT_REQUESTED",
        notes: normalizeNotes(notes),
        metadata: { channel: "WEBSITE", requestedAt: now.toISOString() },
      },
    });

    return tx.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: checkoutInclude,
    });
  });
}

export async function confirmReceptionCheckout({
  bookingIdentifier,
  receptionistId,
  guestVerified,
  paymentVerified,
  checkedOutAt,
  notes,
  channel,
}: {
  bookingIdentifier: string;
  receptionistId: string;
  guestVerified: boolean;
  paymentVerified: boolean;
  checkedOutAt: Date;
  notes?: string | null;
  channel: CheckoutChannel;
}) {
  return prisma.$transaction(async (tx) => {
    const receptionist = await tx.user.findUnique({
      where: { id: receptionistId },
      select: { id: true, role: true, name: true },
    });
    if (!receptionist || receptionist.role !== "RECEPTIONIST") {
      throw new CheckoutFlowError(
        "RECEPTIONIST_REQUIRED",
        "Hanya Receptionist yang dapat mengonfirmasi checkout.",
        403,
      );
    }

    const booking = await tx.booking.findFirst({
      where: { OR: [{ id: bookingIdentifier }, { bookingCode: bookingIdentifier }] },
      include: { checkout: true },
    });
    if (!booking) {
      throw new CheckoutFlowError("BOOKING_NOT_FOUND", "Booking tidak ditemukan.", 404);
    }
    if (booking.checkout?.status === "CHECKED_OUT" || booking.status === "COMPLETED") {
      throw new CheckoutFlowError("ALREADY_CHECKED_OUT", "Booking ini sudah checkout.");
    }
    if (!isActiveStay(booking)) {
      throw new CheckoutFlowError(
        "STAY_NOT_ACTIVE",
        "Receptionist hanya dapat memproses tamu yang sedang menginap.",
      );
    }
    if (!guestVerified) {
      throw new CheckoutFlowError("GUEST_NOT_VERIFIED", "Data tamu wajib diverifikasi.", 400);
    }
    if (!paymentVerified || booking.paymentStatus !== "PAID") {
      throw new CheckoutFlowError(
        "PAYMENT_NOT_SETTLED",
        "Checkout tidak dapat diselesaikan sebelum seluruh pembayaran berstatus lunas.",
      );
    }
    if (Number.isNaN(checkedOutAt.getTime())) {
      throw new CheckoutFlowError("INVALID_CHECKOUT_TIME", "Waktu checkout tidak valid.", 400);
    }
    if (checkedOutAt.getTime() > Date.now() + 5 * 60_000) {
      throw new CheckoutFlowError(
        "INVALID_CHECKOUT_TIME",
        "Waktu checkout tidak boleh berada di masa mendatang.",
        400,
      );
    }
    if (dateKey(checkedOutAt) < dateKey(booking.checkIn)) {
      throw new CheckoutFlowError(
        "INVALID_CHECKOUT_TIME",
        "Waktu checkout tidak boleh lebih awal dari tanggal check-in.",
        400,
      );
    }

    const previousStatus: CheckoutStatus = booking.checkout?.status ?? "ACTIVE";
    const effectiveChannel: CheckoutChannel =
      booking.checkout?.channel === "WEBSITE" ? "WEBSITE" : channel;
    const now = new Date();
    const checkout = await tx.checkout.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        status: "CHECKED_OUT",
        channel: effectiveChannel,
        processedById: receptionist.id,
        checkedOutAt,
        guestVerifiedAt: now,
        paymentVerifiedAt: now,
        notes: normalizeNotes(notes),
      },
      update: {
        status: "CHECKED_OUT",
        channel: effectiveChannel,
        processedById: receptionist.id,
        checkedOutAt,
        guestVerifiedAt: now,
        paymentVerifiedAt: now,
        notes: normalizeNotes(notes) ?? booking.checkout?.notes,
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED", expiresAt: null },
    });
    await tx.villaAvailability.updateMany({
      where: { bookingId: booking.id },
      data: {
        bookingId: null,
        status: "AVAILABLE",
        holdExpiresAt: null,
        bookedAt: null,
        note: `Checkout ${booking.bookingCode} dikonfirmasi ${receptionist.name ?? "Receptionist"}`,
      },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        actorId: receptionist.id,
        fromStatus: booking.status,
        toStatus: "COMPLETED",
        reason: "Checkout dikonfirmasi oleh Receptionist.",
        metadata: {
          checkoutId: checkout.id,
          channel: effectiveChannel,
          checkedOutAt: checkedOutAt.toISOString(),
          guestVerified: true,
          paymentVerified: true,
        },
      },
    });
    await tx.checkoutEvent.create({
      data: {
        checkoutId: checkout.id,
        actorId: receptionist.id,
        fromStatus: previousStatus,
        toStatus: "CHECKED_OUT",
        eventType: "CHECKOUT_CONFIRMED",
        notes: normalizeNotes(notes),
        metadata: {
          channel: effectiveChannel,
          checkedOutAt: checkedOutAt.toISOString(),
          roomReleased: true,
        },
      },
    });

    return tx.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: checkoutInclude,
    });
  });
}

export function serializeCheckoutBooking(record: CheckoutBooking) {
  const active = isActiveStay(record);
  const inferredStatus: CheckoutStatus | null = record.checkout?.status ??
    (record.status === "COMPLETED" ? "CHECKED_OUT" : active ? "ACTIVE" : null);

  return {
    bookingId: record.id,
    bookingCode: record.bookingCode,
    bookingStatus: record.status,
    paymentStatus: record.paymentStatus,
    guest: {
      id: record.user?.id ?? null,
      name: record.user?.name?.trim() || record.guestName,
      email: record.user?.email || record.guestEmail,
      phone: record.guestPhone,
    },
    villa: {
      id: record.villa.id,
      name: record.villa.name,
      location: record.villa.location,
      image: record.villa.images[0]?.url ?? null,
    },
    stay: {
      checkIn: dateKey(record.checkIn),
      checkOut: dateKey(record.checkOut),
      nights: record.nights,
      guests: record.guests,
    },
    totalAmount: record.totalAmount,
    checkout: {
      id: record.checkout?.id ?? null,
      status: inferredStatus,
      statusLabel: checkoutStatusLabel(inferredStatus),
      channel: record.checkout?.channel ?? null,
      requestedAt: record.checkout?.requestedAt?.toISOString() ?? null,
      checkedOutAt: record.checkout?.checkedOutAt?.toISOString() ?? null,
      guestVerifiedAt: record.checkout?.guestVerifiedAt?.toISOString() ?? null,
      paymentVerifiedAt: record.checkout?.paymentVerifiedAt?.toISOString() ?? null,
      notes: record.checkout?.notes ?? null,
      requestedBy: record.checkout?.requestedBy ?? null,
      processedBy: record.checkout?.processedBy ?? null,
      canRequest: active && !record.checkout,
      canConfirm:
        active &&
        record.status === "CONFIRMED" &&
        record.paymentStatus === "PAID" &&
        record.checkout?.status !== "CHECKED_OUT",
      paymentReady: record.paymentStatus === "PAID",
      history: (record.checkout?.events ?? []).map((event) => ({
        id: event.id,
        eventType: event.eventType,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        notes: event.notes,
        actor: event.actor,
        createdAt: event.createdAt.toISOString(),
      })),
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function isActiveStay(record: {
  status: string;
  checkIn: Date;
  checkOut: Date;
}) {
  const today = dateKey(new Date());
  return (
    record.status === "CONFIRMED" &&
    dateKey(record.checkIn) <= today &&
    dateKey(record.checkOut) >= today
  );
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeNotes(value?: string | null) {
  const notes = value?.trim();
  return notes ? notes.slice(0, 2000) : null;
}

function checkoutStatusLabel(status: CheckoutStatus | null) {
  if (status === "ACTIVE") return "Active";
  if (status === "CHECKOUT_REQUESTED") return "Checkout Requested";
  if (status === "CHECKED_OUT") return "Checked Out";
  return "Belum masuk masa inap";
}
