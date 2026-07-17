import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findBookingRecord,
  updateBookingPaymentState,
  updateBookingStatus,
} from "@/lib/booking-store";
import { reviewManualPaymentProof } from "@/lib/payment-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const reviewSchema = z.object({
  action: z.enum(["VERIFY", "REJECT"]),
  reason: z.string().trim().min(3).max(1000).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!canReviewPayment(request)) {
    return NextResponse.json(
      {
        error: "FORBIDDEN",
        message: "Anda tidak memiliki akses verifikasi pembayaran.",
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

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYMENT_REVIEW",
        message: "Keputusan verifikasi tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  if (parsed.data.action === "REJECT" && !parsed.data.reason) {
    return NextResponse.json(
      {
        error: "REJECTION_REASON_REQUIRED",
        message: "Alasan penolakan wajib diisi.",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const reviewerId = request.headers.get("x-user-id")?.trim() || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const proof = await findDatabaseProof(tx, id);
      if (!proof) return null;
      if (proof.status !== "PENDING") {
        return { conflict: proof.status } as const;
      }

      const reviewer = reviewerId
        ? await tx.user.findUnique({
            where: { id: reviewerId },
            select: { id: true },
          })
        : null;
      const now = new Date();
      const verified = parsed.data.action === "VERIFY";
      const updatedProof = await tx.paymentProof.update({
        where: { id: proof.id },
        data: {
          status: verified ? "VERIFIED" : "REJECTED",
          reviewerId: reviewer?.id ?? null,
          reviewedAt: now,
          rejectionReason: verified ? null : parsed.data.reason,
        },
      });
      const payment = await tx.payment.update({
        where: { id: proof.payment.id },
        data: {
          status: verified ? "PAID" : "FAILED",
          paidAt: verified ? now : null,
          failedAt: verified ? null : now,
        },
      });

      const bookingPaymentStatus = verified
        ? payment.amount >= proof.payment.booking.totalAmount
          ? "PAID"
          : "PARTIALLY_PAID"
        : "FAILED";
      const shouldConfirm =
        verified &&
        ["PENDING", "WAITING_PAYMENT"].includes(proof.payment.booking.status);
      const booking = await tx.booking.update({
        where: { id: proof.payment.booking.id },
        data: {
          paymentStatus: bookingPaymentStatus,
          ...(shouldConfirm
            ? { status: "CONFIRMED", confirmedAt: now, expiresAt: null }
            : {}),
        },
      });

      if (shouldConfirm) {
        await tx.villaAvailability.updateMany({
          where: { bookingId: booking.id },
          data: { status: "BOOKED", bookedAt: now, holdExpiresAt: null },
        });
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            actorId: reviewer?.id ?? null,
            fromStatus: proof.payment.booking.status,
            toStatus: "CONFIRMED",
            reason: "Pembayaran manual diverifikasi.",
            metadata: {
              paymentId: payment.id,
              paymentProofId: updatedProof.id,
            },
          },
        });
      }

      return {
        conflict: null,
        booking,
        payment,
        proof: updatedProof,
      } as const;
    });

    if (!result) return paymentProofNotFound();
    if (result.conflict) return alreadyReviewed(result.conflict);
    return NextResponse.json({
      data: result,
      message:
        parsed.data.action === "VERIFY"
          ? "Pembayaran manual berhasil diverifikasi."
          : "Bukti pembayaran ditolak.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin manual payment confirmation error", error);
      return NextResponse.json(
        {
          error: "PAYMENT_REVIEW_FAILED",
          message: "Verifikasi pembayaran belum dapat diproses.",
        },
        { status: 500 },
      );
    }
    return reviewMemoryPayment({
      id,
      action: parsed.data.action,
      reason: parsed.data.reason,
      reviewerId,
    });
  }
}

async function findDatabaseProof(
  tx: Prisma.TransactionClient,
  identifier: string,
) {
  const directProof = await tx.paymentProof.findUnique({
    where: { id: identifier },
    include: { payment: { include: { booking: true } } },
  });
  if (directProof) return directProof;
  const payment = await tx.payment.findFirst({
    where: {
      OR: [
        { id: identifier },
        { bookingId: identifier },
        { booking: { bookingCode: identifier } },
      ],
    },
    include: {
      booking: true,
      proofs: { orderBy: { uploadedAt: "desc" }, take: 1 },
    },
  });
  const proof = payment?.proofs[0];
  return proof
    ? tx.paymentProof.findUnique({
        where: { id: proof.id },
        include: { payment: { include: { booking: true } } },
      })
    : null;
}

function reviewMemoryPayment({
  id,
  action,
  reason,
  reviewerId,
}: {
  id: string;
  action: "VERIFY" | "REJECT";
  reason?: string | null;
  reviewerId: string | null;
}) {
  const review = reviewManualPaymentProof({
    identifier: id,
    action,
    reviewerId,
    rejectionReason: reason,
  });
  if (!review) return paymentProofNotFound();
  if (!review.updated) return alreadyReviewed(review.proof.status);
  const proof = review.proof;

  const current = findBookingRecord(proof.bookingId);
  if (!current) return paymentProofNotFound();
  let booking = updateBookingPaymentState(current.id, {
    paymentStatus: action === "VERIFY" ? "PAID" : "FAILED",
  });
  if (action === "VERIFY" && booking) {
    booking =
      updateBookingStatus({
        bookingId: booking.id,
        status: "CONFIRMED",
        actorId: reviewerId,
        reason: "Pembayaran manual diverifikasi.",
        metadata: { paymentProofId: proof.id },
      })?.booking ?? booking;
  }

  return NextResponse.json({
    data: { booking, proof },
    message:
      action === "VERIFY"
        ? "Pembayaran manual berhasil diverifikasi."
        : "Bukti pembayaran ditolak.",
    meta: { source: "memory-fallback" },
  });
}

function canReviewPayment(request: Request) {
  return ["SUPER_ADMIN", "ADMIN", "FINANCE"].includes(
    request.headers.get("x-user-role") ?? "",
  );
}

function paymentProofNotFound() {
  return NextResponse.json(
    {
      error: "PAYMENT_PROOF_NOT_FOUND",
      message: "Bukti pembayaran tidak ditemukan.",
    },
    { status: 404 },
  );
}

function alreadyReviewed(status: string) {
  return NextResponse.json(
    {
      error: "PAYMENT_PROOF_ALREADY_REVIEWED",
      message: "Bukti pembayaran sudah pernah ditinjau.",
      data: { status },
    },
    { status: 409 },
  );
}
