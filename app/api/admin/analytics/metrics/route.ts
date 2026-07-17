import { NextResponse } from "next/server";
import { z } from "zod";
import { listBookingRecords } from "@/lib/booking-store";
import { listAdminVillaRecords } from "@/lib/admin-villa-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";
import { hasPermission } from "@/lib/rbac";

const querySchema = z
  .object({
    period: z.enum(["7d", "30d", "90d", "12m", "custom"]).default("30d"),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    groupBy: z.enum(["day", "week", "month"]).optional(),
  })
  .refine((value) => value.period !== "custom" || (value.from && value.to), {
    message: "Periode custom membutuhkan tanggal awal dan akhir.",
    path: ["from"],
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Tanggal awal tidak boleh melewati tanggal akhir.",
    path: ["to"],
  });

type AnalyticsBooking = {
  id: string;
  bookingCode: string;
  villaId: string;
  villaName: string;
  guestName: string;
  guestEmail: string;
  status: string;
  paymentStatus: string;
  nights: number;
  totalAmount: number;
  createdAt: Date;
};

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Periode analytics tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const range = resolveRange(parsed.data);
  const groupBy = parsed.data.groupBy ?? defaultGrouping(parsed.data.period);

  try {
    const [current, previous, villaCount] = await prisma.$transaction([
      prisma.booking.findMany({
        where: { createdAt: { gte: range.from, lte: range.to } },
        select: {
          id: true,
          bookingCode: true,
          villaId: true,
          villa: { select: { name: true } },
          guestName: true,
          guestEmail: true,
          status: true,
          paymentStatus: true,
          nights: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: range.previousFrom, lt: range.from } },
        select: {
          id: true,
          bookingCode: true,
          villaId: true,
          villa: { select: { name: true } },
          guestName: true,
          guestEmail: true,
          status: true,
          paymentStatus: true,
          nights: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      prisma.villa.count({ where: { status: "PUBLISHED" } }),
    ]);
    return NextResponse.json({
      data: buildAnalytics(
        current.map(normalizeDatabaseBooking),
        previous.map(normalizeDatabaseBooking),
        villaCount,
        range,
        groupBy,
      ),
      meta: { source: "database", period: parsed.data.period, groupBy },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin analytics API error", error);
      return NextResponse.json(
        { message: "Metrik dashboard belum dapat dimuat." },
        { status: 500 },
      );
    }
  }

  const all = listBookingRecords().map((booking) => ({
    id: booking.id,
    bookingCode: booking.bookingCode,
    villaId: booking.villaId,
    villaName: booking.villaName,
    guestName: booking.guest.name,
    guestEmail: booking.guest.email,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    nights: booking.nights,
    totalAmount: booking.amounts.totalAmount,
    createdAt: new Date(booking.createdAt),
  }));
  const current = inRange(all, range.from, range.to);
  const previous = inRange(all, range.previousFrom, range.from, false);
  const villaCount = listAdminVillaRecords().filter(
    (villa) => villa.status === "PUBLISHED",
  ).length;
  return NextResponse.json({
    data: buildAnalytics(current, previous, villaCount, range, groupBy),
    meta: { source: "memory-fallback", period: parsed.data.period, groupBy },
  });
}

function normalizeDatabaseBooking(booking: {
  id: string;
  bookingCode: string;
  villaId: string;
  villa: { name: string };
  guestName: string;
  guestEmail: string;
  status: string;
  paymentStatus: string;
  nights: number;
  totalAmount: number;
  createdAt: Date;
}): AnalyticsBooking {
  return { ...booking, villaName: booking.villa.name };
}

function buildAnalytics(
  current: AnalyticsBooking[],
  previous: AnalyticsBooking[],
  villaCount: number,
  range: ReturnType<typeof resolveRange>,
  groupBy: "day" | "week" | "month",
) {
  const metrics = summarize(current, villaCount, range.days);
  const previousMetrics = summarize(previous, villaCount, range.days);
  const statusMap = new Map<string, number>();
  const villas = new Map<
    string,
    {
      villaId: string;
      villaName: string;
      bookings: number;
      nights: number;
      revenue: number;
    }
  >();
  for (const booking of current) {
    statusMap.set(booking.status, (statusMap.get(booking.status) ?? 0) + 1);
    const villa = villas.get(booking.villaId) ?? {
      villaId: booking.villaId,
      villaName: booking.villaName,
      bookings: 0,
      nights: 0,
      revenue: 0,
    };
    villa.bookings += 1;
    if (isOccupied(booking)) villa.nights += booking.nights;
    if (isRevenue(booking)) villa.revenue += booking.totalAmount;
    villas.set(booking.villaId, villa);
  }
  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    metrics: {
      ...metrics,
      trends: {
        revenue: trend(metrics.revenue, previousMetrics.revenue),
        bookings: trend(metrics.bookings, previousMetrics.bookings),
        occupancy: trend(metrics.occupancy, previousMetrics.occupancy),
        customers: trend(metrics.customers, previousMetrics.customers),
      },
    },
    revenueSeries: createSeries(current, range.from, range.to, groupBy),
    bookingStatuses: Array.from(statusMap, ([status, count]) => ({
      status,
      count,
    })),
    topVillas: Array.from(villas.values())
      .map((villa) => ({
        ...villa,
        occupancy: percentage(villa.nights, Math.max(1, range.days)),
      }))
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5),
    recentBookings: current.slice(0, 8),
  };
}

function summarize(
  bookings: AnalyticsBooking[],
  villaCount: number,
  days: number,
) {
  const occupiedNights = bookings
    .filter(isOccupied)
    .reduce((total, booking) => total + booking.nights, 0);
  return {
    revenue: bookings
      .filter(isRevenue)
      .reduce((total, booking) => total + booking.totalAmount, 0),
    bookings: bookings.length,
    occupancy: percentage(occupiedNights, Math.max(1, villaCount * days)),
    customers: new Set(
      bookings.map((booking) => booking.guestEmail.toLowerCase()),
    ).size,
  };
}

function createSeries(
  bookings: AnalyticsBooking[],
  from: Date,
  to: Date,
  groupBy: "day" | "week" | "month",
) {
  const buckets = new Map<
    string,
    { label: string; revenue: number; bookings: number }
  >();
  for (const booking of bookings) {
    const key = bucketKey(booking.createdAt, groupBy);
    const bucket = buckets.get(key) ?? { label: key, revenue: 0, bookings: 0 };
    bucket.bookings += 1;
    if (isRevenue(booking)) bucket.revenue += booking.totalAmount;
    buckets.set(key, bucket);
  }
  return Array.from(buckets.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function bucketKey(date: Date, groupBy: "day" | "week" | "month") {
  const value = new Date(date);
  if (groupBy === "month") return value.toISOString().slice(0, 7);
  if (groupBy === "week") {
    const day = value.getUTCDay() || 7;
    value.setUTCDate(value.getUTCDate() - day + 1);
  }
  return value.toISOString().slice(0, 10);
}

function resolveRange(input: z.infer<typeof querySchema>) {
  const to = input.to ? endOfDay(input.to) : endOfDay(new Date());
  const days =
    input.period === "7d"
      ? 7
      : input.period === "90d"
        ? 90
        : input.period === "12m"
          ? 365
          : 30;
  const from =
    input.period === "custom" && input.from
      ? startOfDay(input.from)
      : addDays(to, -(days - 1));
  const duration = to.getTime() - from.getTime() + 1;
  return {
    from,
    to,
    previousFrom: new Date(from.getTime() - duration),
    days: Math.max(1, Math.ceil(duration / 86_400_000)),
  };
}

function defaultGrouping(
  period: z.infer<typeof querySchema>["period"],
): "day" | "week" | "month" {
  if (period === "12m") return "month";
  if (period === "90d") return "week";
  return "day";
}

function inRange(
  items: AnalyticsBooking[],
  from: Date,
  to: Date,
  inclusive = true,
) {
  return items.filter(
    (item) =>
      item.createdAt >= from &&
      (inclusive ? item.createdAt <= to : item.createdAt < to),
  );
}

function isRevenue(booking: AnalyticsBooking) {
  return (
    booking.paymentStatus === "PAID" &&
    !["CANCELLED", "REFUNDED"].includes(booking.status)
  );
}

function isOccupied(booking: AnalyticsBooking) {
  return ["CONFIRMED", "COMPLETED"].includes(booking.status);
}

function trend(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function percentage(value: number, total: number) {
  return Math.min(100, Math.round((value / total) * 1000) / 10);
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return startOfDay(value);
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

function isAdmin(request: Request) {
  return hasPermission(
    request.headers.get("x-user-role") ?? "",
    "dashboard.view",
  );
}
