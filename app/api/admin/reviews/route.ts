import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { listAdminReviewRecords } from "@/lib/admin-review-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";
import { hasPermission } from "@/lib/rbac";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  villaId: z.string().trim().min(1).optional(),
  status: z.enum(["PENDING", "PUBLISHED", "HIDDEN", "FLAGGED"]).optional(),
  isFeatured: z.enum(["true", "false"]).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export async function GET(request: Request) {
  if (!isAdmin(request)) return forbidden();
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Filter ulasan tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const { page, limit, search, villaId, status, isFeatured, rating } =
    parsed.data;
  const where: Prisma.ReviewWhereInput = {
    villaId,
    status,
    rating,
    isFeatured: isFeatured === undefined ? undefined : isFeatured === "true",
    OR: search
      ? [
          { title: { contains: search, mode: "insensitive" } },
          { comment: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { villa: { name: { contains: search, mode: "insensitive" } } },
        ]
      : undefined,
  };

  try {
    const [reviews, total, grouped] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          villa: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ["status"],
        orderBy: { status: "asc" },
        _count: { _all: true },
      }),
    ]);
    return response(reviews, total, page, limit, "database", grouped);
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
  }

  const normalizedSearch = search?.toLocaleLowerCase("id-ID");
  const allReviews = listAdminReviewRecords();
  const filtered = allReviews.filter((review) => {
    if (villaId && review.villaId !== villaId) return false;
    if (status && review.status !== status) return false;
    if (rating && review.rating !== rating) return false;
    if (
      isFeatured !== undefined &&
      review.isFeatured !== (isFeatured === "true")
    ) {
      return false;
    }
    return (
      !normalizedSearch ||
      `${review.title ?? ""} ${review.comment} ${review.user.name ?? ""} ${review.user.email} ${review.villa.name}`
        .toLocaleLowerCase("id-ID")
        .includes(normalizedSearch)
    );
  });
  return response(
    filtered.slice((page - 1) * limit, page * limit),
    filtered.length,
    page,
    limit,
    "memory-fallback",
    statusCounts(allReviews),
  );
}

function response(
  reviews: unknown[],
  total: number,
  page: number,
  limit: number,
  source: "database" | "memory-fallback",
  grouped: unknown,
) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return NextResponse.json({
    reviews,
    summary: normalizeStatusCounts(grouped),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
    meta: { source },
  });
}

function statusCounts(reviews: ReturnType<typeof listAdminReviewRecords>) {
  return reviews.map((review) => ({
    status: review.status,
    _count: { _all: 1 },
  }));
}

function normalizeStatusCounts(grouped: unknown) {
  const counts = { PENDING: 0, PUBLISHED: 0, HIDDEN: 0, FLAGGED: 0 };
  if (!Array.isArray(grouped)) return counts;
  for (const item of grouped) {
    if (!item || typeof item !== "object") continue;
    const status = "status" in item ? String(item.status) : "";
    const countValue =
      "_count" in item &&
      item._count &&
      typeof item._count === "object" &&
      "_all" in item._count
        ? Number(item._count._all)
        : 0;
    if (status in counts) counts[status as keyof typeof counts] += countValue;
  }
  return counts;
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

function serverError(error: unknown) {
  console.error("Admin review API error", error);
  return NextResponse.json(
    { message: "Data ulasan belum dapat diproses." },
    { status: 500 },
  );
}
