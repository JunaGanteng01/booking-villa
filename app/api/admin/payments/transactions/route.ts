import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findBookingRecord } from "@/lib/booking-store";
import {
  listGatewaySnapshots,
  listManualPaymentProofs,
  listMemoryPaymentRefunds,
  listSavedPaymentMethods,
  listStripeCheckoutSessions,
} from "@/lib/payment-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const paymentStatuses = [
  "PENDING",
  "REQUIRES_ACTION",
  "PAID",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

const querySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(160).optional(),
    status: z.enum(paymentStatuses).optional(),
    provider: z
      .enum(["MANUAL", "MIDTRANS", "STRIPE", "XENDIT", "MOCK"])
      .optional(),
    method: z.string().trim().max(80).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    minAmount: z.coerce.number().int().min(0).optional(),
    maxAmount: z.coerce.number().int().min(0).optional(),
    sort: z
      .enum(["newest", "oldest", "amount_desc", "amount_asc"])
      .default("newest"),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Tanggal awal tidak boleh melewati tanggal akhir.",
    path: ["to"],
  })
  .refine(
    (value) =>
      value.minAmount === undefined ||
      value.maxAmount === undefined ||
      value.minAmount <= value.maxAmount,
    {
      message: "Nominal minimum tidak boleh melebihi nominal maksimum.",
      path: ["maxAmount"],
    },
  );

type TransactionStatus = (typeof paymentStatuses)[number];

type TransactionDto = {
  id: string;
  bookingId: string;
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  villaName: string;
  method: string;
  provider: string;
  reference: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: TransactionStatus;
  displayStatus: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function GET(request: Request) {
  if (!canViewTransactions(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Filter transaksi tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const filters = parsed.data;
  const where = createDatabaseWhere(filters);

  try {
    const [payments, total, aggregate, paidAggregate, refundAggregate] =
      await prisma.$transaction([
        prisma.payment.findMany({
          where,
          include: {
            booking: {
              select: {
                bookingCode: true,
                guestName: true,
                guestEmail: true,
                villa: { select: { name: true } },
              },
            },
            paymentMethod: { select: { code: true, name: true } },
          },
          orderBy: createOrderBy(filters.sort),
          skip: (filters.page - 1) * filters.limit,
          take: filters.limit,
        }),
        prisma.payment.count({ where }),
        prisma.payment.aggregate({
          where,
          _sum: { amount: true, feeAmount: true },
        }),
        prisma.payment.aggregate({
          where: { AND: [where, { status: "PAID" }] },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        prisma.refund.aggregate({
          where: { payment: where, status: "SUCCEEDED" },
          _sum: { amount: true },
        }),
      ]);
    const transactions = payments.map((payment) =>
      serializeDatabaseTransaction(payment),
    );
    return transactionResponse({
      transactions,
      total,
      page: filters.page,
      limit: filters.limit,
      source: "database",
      summary: {
        grossAmount: aggregate._sum.amount ?? 0,
        feeAmount: aggregate._sum.feeAmount ?? 0,
        paidAmount: paidAggregate._sum.amount ?? 0,
        paidCount: paidAggregate._count._all,
        refundedAmount: refundAggregate._sum.amount ?? 0,
      },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin transaction history API error", error);
      return NextResponse.json(
        { message: "Riwayat transaksi belum dapat dimuat." },
        { status: 500 },
      );
    }
  }

  const allTransactions = createMemoryTransactions();
  const filtered = sortTransactions(
    allTransactions.filter((transaction) =>
      matchesFilters(transaction, filters),
    ),
    filters.sort,
  );
  const start = (filters.page - 1) * filters.limit;
  const pageItems = filtered.slice(start, start + filters.limit);
  return transactionResponse({
    transactions: pageItems,
    total: filtered.length,
    page: filters.page,
    limit: filters.limit,
    source: "memory-fallback",
    summary: summarize(filtered),
  });
}

function createDatabaseWhere(
  filters: z.infer<typeof querySchema>,
): Prisma.PaymentWhereInput {
  return {
    status: filters.status,
    provider: filters.provider,
    paymentMethod: filters.method
      ? {
          OR: [
            { code: { equals: filters.method, mode: "insensitive" } },
            { name: { contains: filters.method, mode: "insensitive" } },
          ],
        }
      : undefined,
    amount:
      filters.minAmount !== undefined || filters.maxAmount !== undefined
        ? { gte: filters.minAmount, lte: filters.maxAmount }
        : undefined,
    createdAt:
      filters.from || filters.to
        ? { gte: filters.from, lte: filters.to }
        : undefined,
    OR: filters.search
      ? [
          { id: { contains: filters.search, mode: "insensitive" } },
          {
            externalReference: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          {
            booking: {
              bookingCode: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            booking: {
              guestName: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            booking: {
              guestEmail: { contains: filters.search, mode: "insensitive" },
            },
          },
        ]
      : undefined,
  };
}

function createOrderBy(
  sort: z.infer<typeof querySchema>["sort"],
): Prisma.PaymentOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ createdAt: "asc" }, { id: "asc" }];
  if (sort === "amount_desc")
    return [{ amount: "desc" }, { createdAt: "desc" }];
  if (sort === "amount_asc") return [{ amount: "asc" }, { createdAt: "desc" }];
  return [{ createdAt: "desc" }, { id: "desc" }];
}

function serializeDatabaseTransaction(payment: {
  id: string;
  bookingId: string;
  provider: string;
  status: TransactionStatus;
  externalReference: string | null;
  amount: number;
  feeAmount: number;
  currency: string;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  booking: {
    bookingCode: string;
    guestName: string;
    guestEmail: string;
    villa: { name: string };
  };
  paymentMethod: { code: string; name: string } | null;
}): TransactionDto {
  return {
    id: payment.id,
    bookingId: payment.bookingId,
    bookingCode: payment.booking.bookingCode,
    guestName: payment.booking.guestName,
    guestEmail: payment.booking.guestEmail,
    villaName: payment.booking.villa.name,
    method: payment.paymentMethod?.name ?? payment.paymentMethod?.code ?? "-",
    provider: payment.provider,
    reference: payment.externalReference ?? payment.id,
    amount: payment.amount,
    fee: payment.feeAmount,
    netAmount: payment.amount - payment.feeAmount,
    currency: payment.currency,
    status: payment.status,
    displayStatus: toDisplayStatus(payment.status),
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

function createMemoryTransactions(): TransactionDto[] {
  const proofs = new Map(
    listManualPaymentProofs().map((proof) => [proof.bookingId, proof]),
  );
  const gateways = new Map(
    listGatewaySnapshots().map((gateway) => [gateway.bookingId, gateway]),
  );
  const stripes = new Map(
    listStripeCheckoutSessions().map((session) => [session.bookingId, session]),
  );
  const refundedAmounts = listMemoryPaymentRefunds().reduce(
    (totals, refund) =>
      totals.set(
        refund.paymentId,
        (totals.get(refund.paymentId) ?? 0) + refund.amount,
      ),
    new Map<string, number>(),
  );
  return listSavedPaymentMethods().flatMap((payment) => {
    const booking = findBookingRecord(payment.bookingId);
    if (!booking) return [];
    const proof = proofs.get(payment.bookingId);
    const gateway = gateways.get(payment.bookingId);
    const stripe = stripes.get(payment.bookingId);
    const status = memoryStatus({
      proof: proof?.status,
      stripe: stripe?.paymentStatus,
      refundedAmount: refundedAmounts.get(payment.id) ?? 0,
      paymentAmount: payment.amount,
    });
    const provider = stripe ? "STRIPE" : gateway ? "MIDTRANS" : "MANUAL";
    return [
      {
        id: payment.id,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        guestName: booking.guest.name,
        guestEmail: booking.guest.email,
        villaName: booking.villaName,
        method: payment.method.title,
        provider,
        reference:
          stripe?.sessionId ?? gateway?.token ?? proof?.id ?? payment.id,
        amount: payment.amount,
        fee: payment.fee,
        netAmount: payment.amount - payment.fee,
        currency: "IDR",
        status,
        displayStatus: toDisplayStatus(status),
        paidAt:
          status === "PAID"
            ? (proof?.reviewedAt ?? stripe?.updatedAt ?? null)
            : null,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    ];
  });
}

function memoryStatus({
  proof,
  stripe,
  refundedAmount,
  paymentAmount,
}: {
  proof?: "WAITING_REVIEW" | "VERIFIED" | "REJECTED";
  stripe?: "unpaid" | "paid" | "failed" | "refunded";
  refundedAmount: number;
  paymentAmount: number;
}): TransactionStatus {
  if (refundedAmount >= paymentAmount) return "REFUNDED";
  if (refundedAmount > 0) return "PARTIALLY_REFUNDED";
  if (proof === "VERIFIED" || stripe === "paid") return "PAID";
  if (proof === "REJECTED" || stripe === "failed") return "FAILED";
  if (stripe === "refunded") return "REFUNDED";
  return "PENDING";
}

function matchesFilters(
  transaction: TransactionDto,
  filters: z.infer<typeof querySchema>,
) {
  if (filters.status && transaction.status !== filters.status) return false;
  if (filters.provider && transaction.provider !== filters.provider)
    return false;
  if (
    filters.method &&
    !transaction.method.toLowerCase().includes(filters.method.toLowerCase())
  ) {
    return false;
  }
  if (filters.minAmount !== undefined && transaction.amount < filters.minAmount)
    return false;
  if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount)
    return false;
  const createdAt = new Date(transaction.createdAt);
  if (filters.from && createdAt < filters.from) return false;
  if (filters.to && createdAt > filters.to) return false;
  const search = filters.search?.toLocaleLowerCase("id-ID");
  return (
    !search ||
    `${transaction.id} ${transaction.reference} ${transaction.bookingCode} ${transaction.guestName} ${transaction.guestEmail} ${transaction.villaName}`
      .toLocaleLowerCase("id-ID")
      .includes(search)
  );
}

function sortTransactions(
  transactions: TransactionDto[],
  sort: z.infer<typeof querySchema>["sort"],
) {
  return [...transactions].sort((left, right) => {
    if (sort === "oldest") return left.createdAt.localeCompare(right.createdAt);
    if (sort === "amount_desc") return right.amount - left.amount;
    if (sort === "amount_asc") return left.amount - right.amount;
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function summarize(transactions: TransactionDto[]) {
  return transactions.reduce(
    (summary, transaction) => ({
      grossAmount: summary.grossAmount + transaction.amount,
      feeAmount: summary.feeAmount + transaction.fee,
      paidAmount:
        summary.paidAmount +
        (transaction.status === "PAID" ? transaction.amount : 0),
      paidCount: summary.paidCount + (transaction.status === "PAID" ? 1 : 0),
      refundedAmount:
        summary.refundedAmount +
        (transaction.status === "REFUNDED" ? transaction.amount : 0),
    }),
    {
      grossAmount: 0,
      feeAmount: 0,
      paidAmount: 0,
      paidCount: 0,
      refundedAmount: 0,
    },
  );
}

function transactionResponse(input: {
  transactions: TransactionDto[];
  total: number;
  page: number;
  limit: number;
  source: "database" | "memory-fallback";
  summary: {
    grossAmount: number;
    feeAmount: number;
    paidAmount: number;
    paidCount: number;
    refundedAmount: number;
  };
}) {
  const totalPages = Math.max(1, Math.ceil(input.total / input.limit));
  return NextResponse.json({
    transactions: input.transactions,
    summary: {
      ...input.summary,
      netAmount: input.summary.grossAmount - input.summary.feeAmount,
    },
    pagination: {
      page: input.page,
      limit: input.limit,
      total: input.total,
      totalPages,
      hasPreviousPage: input.page > 1,
      hasNextPage: input.page < totalPages,
    },
    meta: { source: input.source },
  });
}

function toDisplayStatus(
  status: TransactionStatus,
): TransactionDto["displayStatus"] {
  if (status === "PAID") return "SUCCESS";
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED")
    return "REFUNDED";
  if (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED")
    return "FAILED";
  return "PENDING";
}

function canViewTransactions(request: Request) {
  const role = request.headers.get("x-user-role");
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "FINANCE";
}
