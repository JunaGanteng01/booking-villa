import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findBookingRecord,
  updateBookingPaymentState,
  updateBookingStatus,
} from "@/lib/booking-store";
import { getDatabaseBookingRecord } from "@/lib/booking-database";
import { triggerPaymentStatusChanged } from "@/lib/notification-triggers";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const checkInSchema = z.object({
  guestVerified: z.literal(true),
  amountReceived: z.coerce.number().int().min(0),
  paymentMethod: z
    .enum(["CASH", "BANK_TRANSFER", "QRIS", "E_WALLET"])
    .nullable()
    .optional(),
  paymentReference: z.string().trim().max(120).nullable().optional(),
  identityLast4: z.string().trim().regex(/^[A-Za-z0-9]{4}$/).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(roleOf(request))) {
    return NextResponse.json(
      {
        error: "RECEPTION_ACCESS_REQUIRED",
        message: "Hanya tim operasional yang dapat memproses check-in.",
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

  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_CHECK_IN_DATA",
        message: "Lengkapi verifikasi tamu dan data pelunasan.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const actorId = request.headers.get("x-user-id")?.trim() || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findFirst({
        where: { OR: [{ id }, { bookingCode: id }] },
      });
      if (!current) return { kind: "not_found" as const };
      if (current.status === "CHECKED_IN") {
        return { kind: "already_checked_in" as const };
      }
      if (current.status !== "CONFIRMED") {
        return {
          kind: "invalid_status" as const,
          status: current.status,
        };
      }

      const outstanding = Math.max(current.remainingAmount, 0);
      if (outstanding > 0 && !parsed.data.paymentMethod) {
        return { kind: "payment_method_required" as const, outstanding };
      }
      if (parsed.data.amountReceived !== outstanding) {
        return {
          kind: "amount_mismatch" as const,
          outstanding,
        };
      }

      const actor = actorId
        ? await tx.user.findUnique({
            where: { id: actorId },
            select: { id: true, name: true },
          })
        : null;
      const now = new Date();
      let paymentId: string | null = null;

      if (outstanding > 0 && parsed.data.paymentMethod) {
        const method = paymentMethodConfig(parsed.data.paymentMethod);
        const paymentMethod = await tx.paymentMethod.upsert({
          where: { code: method.code },
          create: {
            code: method.code,
            name: method.name,
            type: method.type,
            provider: "MANUAL",
            description: "Pelunasan langsung saat proses check-in.",
            fixedFee: 0,
            requiresProof: false,
            isActive: true,
          },
          update: {
            name: method.name,
            type: method.type,
            provider: "MANUAL",
            isActive: true,
          },
        });
        const payment = await tx.payment.create({
          data: {
            bookingId: current.id,
            paymentMethodId: paymentMethod.id,
            provider: "MANUAL",
            status: "PAID",
            externalReference: `CHECKIN-${current.bookingCode}-${Date.now()}`,
            amount: outstanding,
            feeAmount: 0,
            currency: "IDR",
            paidAt: now,
            providerPayload: {
              channel: "FRONT_DESK",
              paymentMethod: parsed.data.paymentMethod,
              paymentReference: parsed.data.paymentReference || null,
              recordedBy: actor?.name || "Receptionist",
            },
          },
        });
        paymentId = payment.id;
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            providerEventId: `front-desk-settlement-${payment.id}`,
            eventType: "front_desk.payment.settled",
            payload: {
              bookingId: current.id,
              bookingCode: current.bookingCode,
              amount: outstanding,
              paymentMethod: parsed.data.paymentMethod,
              paymentReference: parsed.data.paymentReference || null,
              actorId: actor?.id ?? null,
            },
            processedAt: now,
          },
        });
      }

      const booking = await tx.booking.update({
        where: { id: current.id },
        data: {
          status: "CHECKED_IN",
          paymentStatus: "PAID",
          remainingAmount: 0,
          checkedInAt: now,
          expiresAt: null,
        },
      });
      await tx.villaAvailability.updateMany({
        where: { bookingId: current.id },
        data: { status: "BOOKED", bookedAt: now, holdExpiresAt: null },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: current.id,
          actorId: actor?.id ?? null,
          fromStatus: current.status,
          toStatus: "CHECKED_IN",
          reason: "Tamu diverifikasi dan proses check-in diselesaikan.",
          metadata: {
            guestVerified: true,
            identityLast4: parsed.data.identityLast4 || null,
            settlementAmount: outstanding,
            paymentMethod: parsed.data.paymentMethod || null,
            paymentId,
            notes: parsed.data.notes || null,
          },
        },
      });

      return { kind: "success" as const, booking, outstanding, paymentId };
    });

    if (result.kind === "not_found") return bookingNotFound();
    if (result.kind === "already_checked_in") {
      return NextResponse.json(
        {
          error: "ALREADY_CHECKED_IN",
          message: "Tamu sudah berstatus check-in.",
        },
        { status: 409 },
      );
    }
    if (result.kind === "invalid_status") {
      return NextResponse.json(
        {
          error: "BOOKING_NOT_CONFIRMED",
          message: `Booking harus berstatus CONFIRMED sebelum check-in. Status saat ini: ${result.status}.`,
        },
        { status: 409 },
      );
    }
    if (result.kind === "payment_method_required") {
      return NextResponse.json(
        {
          error: "PAYMENT_METHOD_REQUIRED",
          message: "Pilih metode pelunasan sisa tagihan.",
          data: { outstanding: result.outstanding },
        },
        { status: 400 },
      );
    }
    if (result.kind === "amount_mismatch") {
      return NextResponse.json(
        {
          error: "SETTLEMENT_AMOUNT_MISMATCH",
          message: "Nominal pelunasan harus sama dengan sisa tagihan.",
          data: { outstanding: result.outstanding },
        },
        { status: 409 },
      );
    }

    const booking = await getDatabaseBookingRecord(result.booking.id);
    if (booking && result.outstanding > 0) {
      void triggerPaymentStatusChanged({
        booking,
        status: "PAID",
        provider: "MANUAL",
        eventId: result.paymentId || `check-in-${booking.id}`,
      });
    }
    return NextResponse.json({
      data: { booking, checkedInAt: result.booking.checkedInAt },
      message:
        result.outstanding > 0
          ? "Pelunasan tercatat dan tamu berhasil check-in."
          : "Tamu berhasil check-in.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Reception check-in error", error);
      return NextResponse.json(
        {
          error: "CHECK_IN_FAILED",
          message: "Check-in belum dapat diproses.",
        },
        { status: 500 },
      );
    }

    const current = findBookingRecord(id);
    if (!current) return bookingNotFound();
    if (current.status === "CHECKED_IN") {
      return NextResponse.json(
        { error: "ALREADY_CHECKED_IN", message: "Tamu sudah berstatus check-in." },
        { status: 409 },
      );
    }
    if (current.status !== "CONFIRMED") {
      return NextResponse.json(
        {
          error: "BOOKING_NOT_CONFIRMED",
          message: "Booking harus dikonfirmasi sebelum check-in.",
        },
        { status: 409 },
      );
    }
    const outstanding = Math.max(current.amounts.remainingAmount, 0);
    if (
      parsed.data.amountReceived !== outstanding ||
      (outstanding > 0 && !parsed.data.paymentMethod)
    ) {
      return NextResponse.json(
        {
          error: "INVALID_SETTLEMENT",
          message: "Metode dan nominal pelunasan belum sesuai.",
          data: { outstanding },
        },
        { status: 409 },
      );
    }
    updateBookingPaymentState(current.id, { paymentStatus: "PAID" });
    const updated = updateBookingStatus({
      bookingId: current.id,
      status: "CHECKED_IN",
      actorId,
      reason: "Tamu diverifikasi dan proses check-in diselesaikan.",
      metadata: {
        guestVerified: true,
        settlementAmount: outstanding,
        paymentMethod: parsed.data.paymentMethod || null,
      },
    });
    if (updated) {
      updated.booking.amounts.remainingAmount = 0;
    }
    return NextResponse.json({
      data: { booking: updated?.booking ?? null, checkedInAt: new Date().toISOString() },
      message:
        outstanding > 0
          ? "Pelunasan tercatat dan tamu berhasil check-in."
          : "Tamu berhasil check-in.",
      meta: { source: "memory-fallback" },
    });
  }
}

function roleOf(request: Request) {
  return request.headers.get("x-user-role")?.trim() || "";
}

function paymentMethodConfig(
  method: "CASH" | "BANK_TRANSFER" | "QRIS" | "E_WALLET",
) {
  if (method === "CASH") {
    return { code: "front-desk-cash", name: "Tunai di Reception", type: "CASH" as const };
  }
  if (method === "BANK_TRANSFER") {
    return {
      code: "front-desk-bank-transfer",
      name: "Transfer Bank di Reception",
      type: "BANK_TRANSFER" as const,
    };
  }
  if (method === "QRIS") {
    return { code: "front-desk-qris", name: "QRIS di Reception", type: "QRIS" as const };
  }
  return {
    code: "front-desk-e-wallet",
    name: "E-Wallet di Reception",
    type: "E_WALLET" as const,
  };
}

function bookingNotFound() {
  return NextResponse.json(
    { error: "BOOKING_NOT_FOUND", message: "Booking tidak ditemukan." },
    { status: 404 },
  );
}
