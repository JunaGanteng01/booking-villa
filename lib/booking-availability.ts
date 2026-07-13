import type { Villa } from "@/lib/villa-data";

export type CalendarStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "PENDING"
  | "MAINTENANCE"
  | "BLOCKED";

type AvailabilityOverride = {
  status: CalendarStatus;
  note?: string;
  priceOverride?: number;
  minStayNights?: number;
};

export type AvailabilityDay = {
  date: string;
  status: CalendarStatus;
  available: boolean;
  pricePerNight: number | null;
  minStayNights: number;
  note: string | null;
};

export const availabilityOverridesByVilla: Record<
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
      minStayNights: 2,
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

export function buildAvailabilityDays(villa: Villa, from: Date, to: Date) {
  const overrides = availabilityOverridesByVilla[villa.id] ?? {};
  const days: AvailabilityDay[] = [];
  const cursor = new Date(from);

  while (cursor.getTime() < to.getTime()) {
    const date = formatDateOnly(cursor);
    const override = overrides[date];
    const isWeekend = [5, 6].includes(cursor.getUTCDay());
    const defaultStatus: CalendarStatus = villa.available ? "AVAILABLE" : "BOOKED";
    const status = override?.status ?? defaultStatus;
    const price =
      override?.priceOverride ??
      (isWeekend && status === "AVAILABLE"
        ? Math.round(villa.price * 1.12)
        : villa.price);

    days.push({
      date,
      status,
      available: status === "AVAILABLE",
      pricePerNight: status === "AVAILABLE" ? price : null,
      minStayNights: override?.minStayNights ?? (isWeekend ? 2 : 1),
      note: override?.note ?? null,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

export function getStayDates(checkIn: string, checkOut: string) {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) return [];

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() < end.getTime()) {
    dates.push(formatDateOnly(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function validateDateRange(
  checkIn: string,
  checkOut: string,
  maxNights = 60,
): { ok: true; start: Date; end: Date; nights: number } | { ok: false; message: string } {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);

  if (!start || !end) {
    return {
      ok: false,
      message: "Format checkIn dan checkOut harus YYYY-MM-DD.",
    };
  }

  if (end.getTime() <= start.getTime()) {
    return {
      ok: false,
      message: "checkOut harus lebih besar dari checkIn.",
    };
  }

  const nights = Math.floor((end.getTime() - start.getTime()) / 86_400_000);
  if (nights > maxNights) {
    return {
      ok: false,
      message: `Maksimal durasi pengecekan adalah ${maxNights} malam.`,
    };
  }

  return { ok: true, start, end, nights };
}

export function parseDateOnly(value: string) {
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

export function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}
