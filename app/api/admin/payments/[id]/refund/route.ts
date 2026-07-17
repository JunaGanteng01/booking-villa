import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findBookingRecord,
  updateBookingPaymentState,
  updateBookingStatus,
} from "@/lib/booking-store";
import { createMemoryPaymentRefund } from "@/lib/payment-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const refundSchema = z.object({
  amount: z.number().int().positive().optional(),
  reason: z.string().trim().min(5).max(1000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!canProcessRefund(request)) {
    return NextResponse.json(
      {
        error: "FORBIDDEN",
        message: "Anda tidak memiliki akses memproses refund.",
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
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_REFUND",
        message: "Data refund tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const actorId = request.headers.get("x-user-id")?.trim() || null;
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const payment = await transaction.payment.findFirst({
        where: {
          OR: [
            { id },
            { externalReference: id },
            { bookingId: id },
            { booking: { bookingCode: id } },
          ],
        },
        include: {
          booking: true,
          refunds: { where: { status: "SUCCEEDED" } },
        },
      });
      if (!payment) return { error: "PAYMENT_NOT_FOUND" as const };
      if (!["PAID", "PARTIALLY_REFUNDED"].includes(payment.status)) {
        return {
          error: "PAYMENT_NOT_REFUNDABLE" as const,
          status: payment.status,
        };
      }
      const refundedBefore = payment.refunds.reduce(
        (total, refund) => total + refund.amount,
        0,
      );
      const refundableAmount = payment.amount - refundedBefore;
      const amount = parsed.data.amount ?? refundableAmount;
      if (refundableAmount <= 0) {
        return { error: "ALREADY_REFUNDED" as const, refundableAmount: 0 };
      }
      if (amount > refundableAmount) {
        return { error: "INVALID_AMOUNT" as const, refundableAmount };
      }

      const actor = actorId
        ? await transaction.user.findUnique({
            where: { id: actorId },
            select: { id: true },
          })
        : null;
      const now = new Date();
      const fullRefund = amount === refundableAmount;
      const refund = await transaction.refund.create({
        data: {
          paymentId: payment.id,
          requestedById: actor?.id ?? null,
          processedById: actor?.id ?? null,
          providerRefundId: `refund_${payment.id}_${Date.now().toString(36)}`,
          status: "SUCCEEDED",
          amount,
          reason: parsed.data.reason,
          processedAt: now,
        },
      });
      const updatedPayment = await transaction.payment.update({
        where: { id: payment.id },
        data: { status: fullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED" },
      });
      const booking = await transaction.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: fullRefund ? "REFUNDED" : "PARTIALLY_PAID",
          ...(fullRefund ? { status: "REFUNDED", expiresAt: null } : {}),
        },
      });

      if (fullRefund) {
        await transaction.villaAvailability.updateMany({
          where: { bookingId: booking.id },
          data: {
            bookingId: null,
            status: "AVAILABLE",
            holdExpiresAt: null,
            bookedAt: null,
          },
        });
        await transaction.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            actorId: actor?.id ?? null,
            fromStatus: payment.booking.status,
            toStatus: "REFUNDED",
            reason: parsed.data.reason,
            metadata: {
              paymentId: payment.id,
              refundId: refund.id,
              amount,
            },
          },
        });
      }
      return {
        refund,
        payment: updatedPayment,
        booking,
        refundedAmount: refundedBefore + amount,
        refundableAmount: refundableAmount - amount,
        fullRefund,
      };
    });

    if (result.error) {
      return refundError({
        error: result.error,
        status: result.status,
        refundableAmount: result.refundableAmount,
      });
    }
    return NextResponse.json(
      {
        data: result,
        message: result.fullRefund
          ? "Refund penuh berhasil diproses."
          : "Refund sebagian berhasil diproses.",
        meta: { source: "database" },
      },
      { status: 201 },
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin refund API error", error);
      return NextResponse.json(
        { error: "REFUND_FAILED", message: "Refund belum dapat diproses." },
        { status: 500 },
      );
    }
  }

  const result = createMemoryPaymentRefund({
    identifier: id,
    amount: parsed.data.amount,
    reason: parsed.data.reason,
    actorId,
  });
  if (result.error) {
    return refundError({
      error: result.error,
      refundableAmount: result.refundableAmount,
    });
  }
  const current = findBookingRecord(result.payment.bookingId);
  if (!current) return refundError({ error: "PAYMENT_NOT_FOUND" });
  let booking = updateBookingPaymentState(current.id, {
    paymentStatus: result.fullRefund ? "REFUNDED" : "PARTIALLY_PAID",
  });
  if (result.fullRefund && booking) {
    booking =
      updateBookingStatus({
        bookingId: booking.id,
        status: "REFUNDED",
        actorId,
        reason: parsed.data.reason,
        metadata: { paymentId: result.payment.id, refundId: result.refund.id },
      })?.booking ?? booking;
  }
  return NextResponse.json(
    {
      data: { ...result, booking },
      message: result.fullRefund
        ? "Refund penuh berhasil diproses."
        : "Refund sebagian berhasil diproses.",
      meta: { source: "memory-fallback" },
    },
    { status: 201 },
  );
}

function canProcessRefund(request: Request) {
  return ["SUPER_ADMIN", "ADMIN", "FINANCE"].includes(
    request.headers.get("x-user-role") ?? "",
  );
}

function refundError(result: {
  error:
    | "PAYMENT_NOT_FOUND"
    | "PAYMENT_NOT_REFUNDABLE"
    | "ALREADY_REFUNDED"
    | "INVALID_AMOUNT";
  status?: string;
  refundableAmount?: number;
}) {
  const errors = {
    PAYMENT_NOT_FOUND: [404, "Pembayaran tidak ditemukan."],
    PAYMENT_NOT_REFUNDABLE: [409, "Status pembayaran belum dapat direfund."],
    ALREADY_REFUNDED: [409, "Seluruh nominal pembayaran sudah direfund."],
    INVALID_AMOUNT: [
      400,
      "Nominal refund melebihi saldo yang dapat dikembalikan.",
    ],
  } as const;
  const [status, message] = errors[result.error];
  return NextResponse.json(
    {
      error: result.error,
      message,
      data: {
        paymentStatus: result.status,
        refundableAmount: result.refundableAmount,
      },
    },
    { status },
  );
}
