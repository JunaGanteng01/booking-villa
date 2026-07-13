import { NextResponse } from "next/server";
import {
  calculateBookingPricing,
  type PricingInput,
} from "@/lib/booking-pricing";
import { getVillaById } from "@/lib/villa-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const addOnParams = url.searchParams.getAll("addOns");

  return handlePricing(request, {
    checkIn: url.searchParams.get("checkIn"),
    checkOut: url.searchParams.get("checkOut"),
    guests: url.searchParams.get("guests"),
    promoCode: url.searchParams.get("promoCode"),
    addOns: addOnParams.length > 0 ? addOnParams : url.searchParams.get("addOns"),
  });
}

export async function POST(request: Request) {
  let body: PricingInput;

  try {
    body = (await request.json()) as PricingInput;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Body request harus JSON valid.",
      },
      { status: 400 },
    );
  }

  return handlePricing(request, body);
}

function handlePricing(request: Request, input: PricingInput) {
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

  const result = calculateBookingPricing(villa, input);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    data: result.data,
    meta: {
      source: "mock",
      note: result.data.available
        ? "Total biaya berhasil dihitung."
        : "Total dihitung sebagai estimasi, tetapi tanggal belum tersedia untuk booking.",
    },
  });
}
