import { NextResponse } from "next/server";
import { getVillaById } from "@/lib/villa-data";

type CalendarStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "PENDING"
  | "MAINTENANCE"
  | "BLOCKED";

type AvailabilityOverride = {
  status: CalendarStatus;
  note?: string;
  priceOverride?: number;
};

const availabilityOverridesByVilla: Record<
  string,
  Record<string, AvailabilityOverride>
> = {
  "aruna-cliffside": {
    "2026-08-21": { status: "BOOKED", note: "Reserved by confirmed booking" },
    "2026-08-22": { status: "BOOKED", note: "Reserved by confirmed booking" },
    "2026-08-29": { status: "PENDING", note: "Awaiting payment confirmation" },
  },
  "sagara-beach": {
    "2026-08-24": { status: "BOOKED" },
    "2026-08-25": { status: "BOOKED" },
    "2026-08-30": {
      status: "AVAILABLE",
      priceOverride: 5900000,
      note: "Weekend premium rate",
    },
  },
  "maira-family-estate": {
    "2026-08-14": { status: "BOOKED" },
    "2026-08-15": { status: "BOOKED" },
    "2026-08-16": { status: "BOOKED" },
    "2026-08-17": { status: "MAINTENANCE", note: "Pool maintenance" },
  },
  "kayumanis-garden": {
    "2026-08-16": { status: "BOOKED" },
    "2026-08-17": { status: "BOOKED" },
    "2026-08-18": { status: "PENDING" },
  },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const id = decodeURIComponent(segments[2] ?? "");
  const villa = getVillaById(id);

  if (!villa) {
    return NextResponse.json(
      {
        error: "VILLA_NOT_FOUND",
        message: "Villa tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const fromParam = url.searchParams.get("from") ?? "2026-08-01";
  const toParam = url.searchParams.get("to") ?? "2026-08-30";
  const from = parseDateOnly(fromParam);
  const to = parseDateOnly(toParam);

  if (!from || !to) {
    return NextResponse.json(
      {
        error: "INVALID_DATE_RANGE",
        message: "Format from dan to harus YYYY-MM-DD.",
      },
      { status: 400 },
    );
  }

  if (to.getTime() < from.getTime()) {
    return NextResponse.json(
      {
        error: "INVALID_DATE_RANGE",
        message: "Tanggal to harus sama atau setelah from.",
      },
      { status: 400 },
    );
  }

  const rangeLength = countDaysInclusive(from, to);
  if (rangeLength > 180) {
    return NextResponse.json(
      {
        error: "DATE_RANGE_TOO_LONG",
        message: "Range kalender maksimal 180 hari per request.",
      },
      { status: 400 },
    );
  }

  const calendar = buildCalendar(villa.id, villa.available, villa.price, from, to);
  const summary = calendar.reduce<Record<CalendarStatus, number>>(
    (acc, day) => {
      acc[day.status] += 1;
      return acc;
    },
    {
      AVAILABLE: 0,
      BOOKED: 0,
      PENDING: 0,
      MAINTENANCE: 0,
      BLOCKED: 0,
    },
  );

  return NextResponse.json({
    data: {
      villaId: villa.id,
      villaName: villa.name,
      from: formatDateOnly(from),
      to: formatDateOnly(to),
      calendar,
      summary,
      legend: {
        AVAILABLE: "Tanggal dapat dipesan",
        BOOKED: "Sudah dibooking",
        PENDING: "Menunggu pembayaran/konfirmasi",
        MAINTENANCE: "Diblokir untuk perawatan",
        BLOCKED: "Diblokir admin",
      },
    },
    meta: {
      source: "mock",
    },
  });
}

function buildCalendar(
  villaId: string,
  villaAvailable: boolean,
  basePrice: number,
  from: Date,
  to: Date,
) {
  const overrides = availabilityOverridesByVilla[villaId] ?? {};
  const dates = [];
  const cursor = new Date(from);

  while (cursor.getTime() <= to.getTime()) {
    const date = formatDateOnly(cursor);
    const override = overrides[date];
    const isWeekend = [5, 6].includes(cursor.getUTCDay());
    const defaultStatus: CalendarStatus = villaAvailable ? "AVAILABLE" : "BOOKED";
    const status = override?.status ?? defaultStatus;
    const price =
      override?.priceOverride ??
      (isWeekend && status === "AVAILABLE"
        ? Math.round(basePrice * 1.12)
        : basePrice);

    dates.push({
      date,
      status,
      pricePerNight: status === "AVAILABLE" ? price : null,
      minStayNights: isWeekend ? 2 : 1,
      note: override?.note ?? null,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function countDaysInclusive(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}
