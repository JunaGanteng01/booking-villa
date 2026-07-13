import { NextResponse } from "next/server";
import {
  buildAvailabilityDays,
  validateDateRange,
} from "@/lib/booking-availability";
import { getVillaById } from "@/lib/villa-data";

type AvailabilityCheckInput = {
  checkIn?: string | null;
  checkOut?: string | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);

  return checkAvailability(request, {
    checkIn: url.searchParams.get("checkIn") ?? url.searchParams.get("from"),
    checkOut: url.searchParams.get("checkOut") ?? url.searchParams.get("to"),
  });
}

export async function POST(request: Request) {
  let body: AvailabilityCheckInput;

  try {
    body = (await request.json()) as AvailabilityCheckInput;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Body request harus JSON valid.",
      },
      { status: 400 },
    );
  }

  return checkAvailability(request, body);
}

function checkAvailability(request: Request, input: AvailabilityCheckInput) {
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
  const validation = validateDateRange(checkIn, checkOut);

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: "INVALID_DATE_RANGE",
        message: validation.message,
      },
      { status: 400 },
    );
  }

  const days = buildAvailabilityDays(villa, validation.start, validation.end);
  const unavailableDates = days
    .filter((day) => !day.available)
    .map((day) => ({
      date: day.date,
      status: day.status,
      note: day.note,
    }));
  const minimumStayRequirement = Math.max(...days.map((day) => day.minStayNights), 1);
  const minStaySatisfied = validation.nights >= minimumStayRequirement;
  const available = unavailableDates.length === 0 && minStaySatisfied;
  const estimatedSubtotal = days.reduce(
    (sum, day) => sum + (day.pricePerNight ?? 0),
    0,
  );

  return NextResponse.json({
    data: {
      villaId: villa.id,
      villaName: villa.name,
      checkIn,
      checkOut,
      nights: validation.nights,
      available,
      unavailableDates,
      minimumStayRequirement,
      minStaySatisfied,
      days,
      estimatedSubtotal: available ? estimatedSubtotal : null,
      blockingReasons: [
        unavailableDates.length > 0
          ? `${unavailableDates.length} tanggal tidak tersedia.`
          : null,
        !minStaySatisfied
          ? `Minimal stay untuk rentang ini ${minimumStayRequirement} malam.`
          : null,
      ].filter(Boolean),
    },
    meta: {
      source: "mock",
      note: available
        ? "Villa tersedia untuk rentang tanggal ini."
        : "Villa belum tersedia untuk rentang tanggal ini.",
    },
  });
}

function normalizeDateInput(value: AvailabilityCheckInput["checkIn"]) {
  return typeof value === "string" ? value.trim() : "";
}
