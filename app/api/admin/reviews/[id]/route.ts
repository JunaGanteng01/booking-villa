import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteAdminReviewRecord,
  getAdminReviewRecord,
  updateAdminReviewRecord,
} from "@/lib/admin-review-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";
import { hasPermission } from "@/lib/rbac";

const updateSchema = z
  .object({
    status: z.enum(["PENDING", "PUBLISHED", "HIDDEN", "FLAGGED"]).optional(),
    isFeatured: z.boolean().optional(),
    moderationNote: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.isFeatured !== undefined ||
      value.moderationNote !== undefined,
    { message: "Minimal satu perubahan harus dikirim." },
  );

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body request harus berupa JSON valid." },
      { status: 400 },
    );
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data moderasi ulasan tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const { id } = await params;

  try {
    const current = await prisma.review.findUnique({ where: { id } });
    if (!current) return notFound();
    const status = parsed.data.status ?? current.status;
    const isFeatured = parsed.data.isFeatured ?? current.isFeatured;
    if (isFeatured && status !== "PUBLISHED") return featuredConflict();

    const review = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.review.update({
        where: { id },
        data: {
          ...parsed.data,
          isFeatured,
          moderatedAt: new Date(),
        },
        include: {
          user: { select: { name: true, email: true } },
          villa: { select: { name: true } },
        },
      });
      await refreshVillaRating(transaction, current.villaId);
      return updated;
    });
    return NextResponse.json({
      review,
      message: "Moderasi ulasan berhasil disimpan.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
  }

  const current = getAdminReviewRecord(id);
  if (!current) return notFound();
  const status = parsed.data.status ?? current.status;
  const isFeatured = parsed.data.isFeatured ?? current.isFeatured;
  if (isFeatured && status !== "PUBLISHED") return featuredConflict();
  const review = updateAdminReviewRecord(id, {
    ...parsed.data,
    isFeatured,
  });
  return NextResponse.json({
    review,
    message: "Moderasi ulasan berhasil disimpan.",
    meta: { source: "memory-fallback" },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  try {
    const current = await prisma.review.findUnique({ where: { id } });
    if (!current) return notFound();
    await prisma.$transaction(async (transaction) => {
      await transaction.review.delete({ where: { id } });
      await refreshVillaRating(transaction, current.villaId);
    });
    return NextResponse.json({
      success: true,
      message: "Ulasan berhasil dihapus.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
  }

  if (!deleteAdminReviewRecord(id)) return notFound();
  return NextResponse.json({
    success: true,
    message: "Ulasan berhasil dihapus.",
    meta: { source: "memory-fallback" },
  });
}

async function refreshVillaRating(
  transaction: Prisma.TransactionClient,
  villaId: string,
) {
  const aggregation = await transaction.review.aggregate({
    where: { villaId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { id: true },
  });
  await transaction.villa.update({
    where: { id: villaId },
    data: {
      ratingAverage: aggregation._avg.rating ?? 0,
      reviewCount: aggregation._count.id,
    },
  });
}

function isAdmin(request: Request) {
  return hasPermission(
    request.headers.get("x-user-role") ?? "",
    "reviews.manage",
  );
}

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

function notFound() {
  return NextResponse.json(
    { message: "Ulasan tidak ditemukan." },
    { status: 404 },
  );
}

function featuredConflict() {
  return NextResponse.json(
    {
      message:
        "Hanya ulasan berstatus published yang dapat dijadikan featured.",
    },
    { status: 409 },
  );
}

function serverError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return notFound();
  }
  console.error("Admin review moderation API error", error);
  return NextResponse.json(
    { message: "Ulasan belum dapat diproses." },
    { status: 500 },
  );
}
