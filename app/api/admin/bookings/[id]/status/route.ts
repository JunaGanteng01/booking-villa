import type { BookingStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findBookingRecord,
  updateBookingStatus,
  type BookingStoreRecord,
} from "@/lib/booking-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const bookingStatuses = [
  "DRAFT",
  "PENDING",
  "WAITING_PAYMENT",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "EXPIRED",
  "REFUNDED",
] as const;

const updateStatusSchema = z.object({
  status: z.enum(bookingStatuses),
  reason: z.string().trim().min(3).max(1000).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["WAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"],
  WAITING_PAYMENT: ["CONFIRMED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
  EXPIRED: [],
  REFUNDED: [],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!canManageBooking(request)) {
    return NextResponse.json(
      {
        error: "FORBIDDEN",
        message: "Anda tidak memiliki akses mengubah booking.",
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Body request harus JSON valid." },
      { status: 400 },
    );
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_STATUS_UPDATE",
        message: "Perubahan status booking tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (parsed.data.status === "CANCELLED" && !parsed.data.reason) {
    return NextResponse.json(
      {
        error: "CANCELLATION_REASON_REQUIRED",
        message: "Alasan pembatalan wajib diisi.",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const actorId = normalizeHeader(request.headers.get("x-user-id"));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findFirst({
        where: { OR: [{ id }, { bookingCode: id }] },
      });
      if (!current) return null;

      const transitionError = validateTransition(
        current.status,
        parsed.data.status,
      );
      if (transitionError) return { transitionError, current } as const;

      const actor = actorId
        ? await tx.user.findUnique({
            where: { id: actorId },
            select: { id: true },
          })
        : null;
      const now = new Date();
      const booking = await tx.booking.update({
        where: { id: current.id },
        data: {
          status: parsed.data.status,
          ...(parsed.data.status === "CONFIRMED"
            ? { confirmedAt: now, expiresAt: null }
            : {}),
          ...(parsed.data.status === "CANCELLED"
            ? { cancelledAt: now, expiresAt: null }
            : {}),
        },
      });

      await updateDatabaseAvailability(tx, current.id, parsed.data.status, now);
      const history = await tx.bookingStatusHistory.create({
        data: {
          bookingId: current.id,
          actorId: actor?.id ?? null,
          fromStatus: current.status,
          toStatus: parsed.data.status,
          reason: parsed.data.reason ?? null,
          metadata:
            parsed.data.metadata == null
              ? undefined
              : (parsed.data.metadata as Prisma.InputJsonValue),
        },
      });

      return { booking, history, transitionError: null } as const;
    });

    if (!result) return bookingNotFound();
    if (result.transitionError) {
      return invalidTransition(
        result.current.status,
        parsed.data.status,
        result.transitionError,
      );
    }
    return NextResponse.json({
      data: result,
      message: "Status booking berhasil diperbarui.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin booking status API error", error);
      return NextResponse.json(
        {
          error: "STATUS_UPDATE_FAILED",
          message: "Status booking belum dapat diperbarui.",
        },
        { status: 500 },
      );
    }

    const current = findBookingRecord(id);
    if (!current) return bookingNotFound();
    const transitionError = validateTransition(
      current.status,
      parsed.data.status,
    );
    if (transitionError) {
      return invalidTransition(
        current.status,
        parsed.data.status,
        transitionError,
      );
    }
    const result = updateBookingStatus({
      bookingId: current.id,
      status: parsed.data.status,
      actorId,
      reason: parsed.data.reason,
      metadata: parsed.data.metadata,
    });
    return NextResponse.json({
      data: result,
      message: "Status booking berhasil diperbarui.",
      meta: { source: "memory-fallback" },
    });
  }
}

function validateTransition(
  current: BookingStatus | BookingStoreRecord["status"],
  target: BookingStatus | BookingStoreRecord["status"],
) {
  if (current === target)
    return "Status booking sudah berada pada nilai tersebut.";
  return allowedTransitions[current as BookingStatus].includes(
    target as BookingStatus,
  )
    ? null
    : `Transisi ${current} ke ${target} tidak diizinkan.`;
}

async function updateDatabaseAvailability(
  tx: Prisma.TransactionClient,
  bookingId: string,
  status: BookingStatus,
  now: Date,
) {
  if (status === "CONFIRMED") {
    await tx.villaAvailability.updateMany({
      where: { bookingId },
      data: { status: "BOOKED", bookedAt: now, holdExpiresAt: null },
    });
    return;
  }
  if (status === "PENDING" || status === "WAITING_PAYMENT") {
    await tx.villaAvailability.updateMany({
      where: { bookingId },
      data: { status: "PENDING" },
    });
    return;
  }
  if (status === "CANCELLED" || status === "EXPIRED") {
    await tx.villaAvailability.updateMany({
      where: { bookingId },
      data: {
        bookingId: null,
        status: "AVAILABLE",
        holdExpiresAt: null,
        bookedAt: null,
      },
    });
  }
}

function canManageBooking(request: Request) {
  return ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(
    request.headers.get("x-user-role") ?? "",
  );
}

function normalizeHeader(value: string | null) {
  return value?.trim() || null;
}

function bookingNotFound() {
  return NextResponse.json(
    { error: "BOOKING_NOT_FOUND", message: "Booking tidak ditemukan." },
    { status: 404 },
  );
}

function invalidTransition(current: string, target: string, message: string) {
  return NextResponse.json(
    {
      error: "INVALID_STATUS_TRANSITION",
      message,
      data: { currentStatus: current, requestedStatus: target },
    },
    { status: 409 },
  );
}
