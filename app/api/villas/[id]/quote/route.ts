import { NextResponse } from "next/server";
import { getVillaById } from "@/lib/villa-data";

type QuoteInput = {
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | string | null;
  promoCode?: string | null;
};

const unavailableDatesByVilla: Record<string, string[]> = {
  "aruna-cliffside": ["2026-08-21", "2026-08-22"],
  "maira-family-estate": ["2026-08-14", "2026-08-15", "2026-08-16", "2026-08-17"],
  "kayumanis-garden": ["2026-08-16", "2026-08-17", "2026-08-18"],
  "sagara-beach": ["2026-08-24", "2026-08-25"],
};

const priceOverridesByVilla: Record<string, Record<string, number>> = {
  "sagara-beach": {
    "2026-08-30": 5900000,
  },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  return calculateQuote(request, {
    checkIn: url.searchParams.get("checkIn"),
    checkOut: url.searchParams.get("checkOut"),
    guests: url.searchParams.get("guests"),
    promoCode: url.searchParams.get("promoCode"),
  });
}

export async function POST(request: Request) {
  let body: QuoteInput;

  try {
    body = (await request.json()) as QuoteInput;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Body request harus JSON valid.",
      },
      { status: 400 },
    );
  }

  return calculateQuote(request, body);
}

function calculateQuote(request: Request, input: QuoteInput) {
  const id = decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean)[2] ?? "",
  );
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

  const checkIn = normalizeDateInput(input.checkIn);
  const checkOut = normalizeDateInput(input.checkOut);
  const guests = parsePositiveInt(input.guests, 1);
  const promoCode = normalizePromo(input.promoCode);
  const dateValidation = validateDateRange(checkIn, checkOut);

  if (!dateValidation.ok) {
    return NextResponse.json(
      {
        error: "INVALID_DATE_RANGE",
        message: dateValidation.message,
      },
      { status: 400 },
    );
  }

  if (guests > villa.guests) {
    return NextResponse.json(
      {
        error: "CAPACITY_EXCEEDED",
        message: `Kapasitas maksimal ${villa.guests} tamu.`,
      },
      { status: 400 },
    );
  }

  const stayDates = getStayDates(checkIn, checkOut);
  const unavailableDates = villa.available
    ? stayDates.filter((date) => unavailableDatesByVilla[villa.id]?.includes(date))
    : stayDates;
  const available = unavailableDates.length === 0;
  const nightlyRates = stayDates.map((date) => {
    const day = parseDateOnly(date);
    const isWeekend = day ? [5, 6].includes(day.getUTCDay()) : false;
    const override = priceOverridesByVilla[villa.id]?.[date];
    const amount = override ?? (isWeekend ? Math.round(villa.price * 1.12) : villa.price);

    return {
      date,
      amount,
      type: override ? "override" : isWeekend ? "weekend" : "base",
    };
  });
  const subtotal = nightlyRates.reduce((sum, rate) => sum + rate.amount, 0);
  const discount = calculateDiscount(subtotal, promoCode);
  const taxableAmount = Math.max(0, subtotal - discount.amount);
  const serviceFee = Math.round(taxableAmount * 0.05);
  const tax = Math.round(taxableAmount * 0.11);
  const total = taxableAmount + serviceFee + tax;

  return NextResponse.json({
    data: {
      villaId: villa.id,
      villaName: villa.name,
      currency: "IDR",
      checkIn,
      checkOut,
      guests,
      nights: stayDates.length,
      available,
      unavailableDates,
      nightlyRates,
      lineItems: [
        {
          code: "subtotal",
          label: `Subtotal ${stayDates.length} malam`,
          amount: subtotal,
        },
        {
          code: "discount",
          label: discount.label,
          amount: -discount.amount,
        },
        {
          code: "service_fee",
          label: "Service fee 5%",
          amount: serviceFee,
        },
        {
          code: "tax",
          label: "Pajak 11%",
          amount: tax,
        },
      ].filter((item) => item.amount !== 0),
      subtotal,
      discount,
      serviceFee,
      tax,
      total,
      payableNow: Math.round(total * 0.3),
    },
    meta: {
      source: "mock",
      note: available
        ? "Estimasi harga dapat dilanjutkan ke booking."
        : "Tanggal mengandung slot yang tidak tersedia.",
    },
  });
}

function normalizeDateInput(value: QuoteInput["checkIn"]) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePromo(value: QuoteInput["promoCode"]) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function parsePositiveInt(value: QuoteInput["guests"], fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function calculateDiscount(subtotal: number, promoCode: string) {
  if (promoCode === "VILLAKU10") {
    return {
      code: promoCode,
      label: "Diskon promo VILLAKU10",
      amount: Math.min(Math.round(subtotal * 0.1), 1_000_000),
    };
  }

  if (promoCode === "EARLYBIRD") {
    return {
      code: promoCode,
      label: "Diskon early bird",
      amount: Math.min(Math.round(subtotal * 0.15), 1_500_000),
    };
  }

  return {
    code: null,
    label: "Diskon",
    amount: 0,
  };
}

function validateDateRange(
  checkIn: string,
  checkOut: string,
): { ok: true } | { ok: false; message: string } {
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
  if (nights > 60) {
    return {
      ok: false,
      message: "Maksimal durasi quote adalah 60 malam.",
    };
  }

  return { ok: true };
}

function getStayDates(checkIn: string, checkOut: string) {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) return [];

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() < end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
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
