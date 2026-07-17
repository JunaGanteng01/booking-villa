import { NextResponse } from "next/server";
import { z } from "zod";
import { listBookingRecords } from "@/lib/booking-store";
import { listAdminVillaRecords } from "@/lib/admin-villa-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";
import { hasPermission } from "@/lib/rbac";

const querySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    villaId: z.string().trim().min(1).optional(),
    status: z
      .enum([
        "DRAFT",
        "PENDING",
        "WAITING_PAYMENT",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
        "EXPIRED",
        "REFUNDED",
      ])
      .optional(),
    groupBy: z.enum(["villa", "day", "month"]).default("villa"),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Tanggal awal tidak boleh melewati tanggal akhir.",
    path: ["to"],
  });

type ReportBooking = {
  villaId: string;
  villaName: string;
  status: string;
  paymentStatus: string;
  nights: number;
  guests: number;
  totalAmount: number;
  createdAt: Date;
};

export async function GET(request: Request) {
  if (!canViewReports(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Filter laporan tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const range = resolveRange(parsed.data.from, parsed.data.to);

  try {
    const [bookings, villaCount] = await prisma.$transaction([
      prisma.booking.findMany({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          villaId: parsed.data.villaId,
          status: parsed.data.status,
        },
        select: {
          villaId: true,
          villa: { select: { name: true } },
          status: true,
          paymentStatus: true,
          nights: true,
          guests: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.villa.count({
        where: {
          status: "PUBLISHED",
          id: parsed.data.villaId,
        },
      }),
    ]);
    return reportResponse(
      bookings.map((booking) => ({
        ...booking,
        villaName: booking.villa.name,
      })),
      Math.max(1, villaCount),
      range,
      parsed.data.groupBy,
      "database",
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin booking revenue report API error", error);
      return NextResponse.json(
        { message: "Laporan belum dapat dibuat." },
        { status: 500 },
      );
    }
  }

  const bookings = listBookingRecords()
    .filter((booking) => {
      const createdAt = new Date(booking.createdAt);
      return (
        createdAt >= range.from &&
        createdAt <= range.to &&
        (!parsed.data.villaId || booking.villaId === parsed.data.villaId) &&
        (!parsed.data.status || booking.status === parsed.data.status)
      );
    })
    .map((booking): ReportBooking => ({
      villaId: booking.villaId,
      villaName: booking.villaName,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      nights: booking.nights,
      guests: booking.guests,
      totalAmount: booking.amounts.totalAmount,
      createdAt: new Date(booking.createdAt),
    }));
  const villaCount = parsed.data.villaId
    ? 1
    : Math.max(
        1,
        listAdminVillaRecords().filter((villa) => villa.status === "PUBLISHED")
          .length,
      );
  return reportResponse(
    bookings,
    villaCount,
    range,
    parsed.data.groupBy,
    "memory-fallback",
  );
}

function reportResponse(
  bookings: ReportBooking[],
  villaCount: number,
  range: ReturnType<typeof resolveRange>,
  groupBy: "villa" | "day" | "month",
  source: "database" | "memory-fallback",
) {
  const rows = aggregateRows(bookings, range.days, villaCount, groupBy);
  const totalNights = bookings
    .filter(isOccupied)
    .reduce((total, booking) => total + booking.nights, 0);
  const revenue = bookings
    .filter(isRevenue)
    .reduce((total, booking) => total + booking.totalAmount, 0);
  const totals = {
    bookings: bookings.length,
    nights: totalNights,
    guests: bookings.reduce((total, booking) => total + booking.guests, 0),
    revenue,
    occupancy: percent(totalNights, range.days * villaCount),
    adr: totalNights ? Math.round(revenue / totalNights) : 0,
  };
  return NextResponse.json({
    rows,
    totals,
    filters: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      groupBy,
    },
    meta: { source, generatedAt: new Date().toISOString() },
  });
}

function aggregateRows(
  bookings: ReportBooking[],
  days: number,
  villaCount: number,
  groupBy: "villa" | "day" | "month",
) {
  const rows = new Map<
    string,
    {
      id: string;
      date: string;
      villaId: string | null;
      villa: string;
      bookings: number;
      nights: number;
      guests: number;
      revenue: number;
    }
  >();
  for (const booking of bookings) {
    const date = booking.createdAt
      .toISOString()
      .slice(0, groupBy === "month" ? 7 : 10);
    const key = groupBy === "villa" ? booking.villaId : date;
    const row = rows.get(key) ?? {
      id: key,
      date:
        groupBy === "villa"
          ? booking.createdAt.toISOString().slice(0, 10)
          : date,
      villaId: groupBy === "villa" ? booking.villaId : null,
      villa: groupBy === "villa" ? booking.villaName : "Semua villa",
      bookings: 0,
      nights: 0,
      guests: 0,
      revenue: 0,
    };
    row.bookings += 1;
    row.guests += booking.guests;
    if (isOccupied(booking)) row.nights += booking.nights;
    if (isRevenue(booking)) row.revenue += booking.totalAmount;
    rows.set(key, row);
  }
  return Array.from(rows.values())
    .map((row) => {
      const capacityDays =
        groupBy === "villa" ? days : (groupBy === "day" ? 1 : 30) * villaCount;
      return {
        ...row,
        occupancy: percent(row.nights, capacityDays),
        adr: row.nights ? Math.round(row.revenue / row.nights) : 0,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

function isRevenue(booking: ReportBooking) {
  return (
    booking.paymentStatus === "PAID" &&
    !["CANCELLED", "REFUNDED"].includes(booking.status)
  );
}

function isOccupied(booking: ReportBooking) {
  return ["CONFIRMED", "COMPLETED"].includes(booking.status);
}

function resolveRange(from?: Date, to?: Date) {
  const end = to ? endOfDay(to) : endOfDay(new Date());
  const start = from
    ? startOfDay(from)
    : new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  return {
    from: start,
    to: end,
    days: Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime() + 1) / 86_400_000),
    ),
  };
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setUTCHours(23, 59, 59, 999);
  return value;
}

function percent(value: number, total: number) {
  return Math.min(100, Math.round((value / Math.max(1, total)) * 1000) / 10);
}

function canViewReports(request: Request) {
  return hasPermission(
    request.headers.get("x-user-role") ?? "",
    "reports.view",
  );
}
