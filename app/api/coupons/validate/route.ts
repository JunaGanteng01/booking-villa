import { NextResponse } from "next/server";
import {
  calculateBookingPricing,
  calculateCouponDiscount,
  couponRules,
  type PricingInput,
} from "@/lib/booking-pricing";
import { getVillaById } from "@/lib/villa-data";

type CouponValidationInput = PricingInput & {
  code?: string | null;
  villaId?: string | null;
  subtotal?: number | string | null;
  nights?: number | string | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const addOnParams = url.searchParams.getAll("addOns");

  return validateCoupon({
    code: url.searchParams.get("code") ?? url.searchParams.get("promoCode"),
    villaId: url.searchParams.get("villaId"),
    checkIn: url.searchParams.get("checkIn"),
    checkOut: url.searchParams.get("checkOut"),
    guests: url.searchParams.get("guests"),
    addOns: addOnParams.length > 0 ? addOnParams : url.searchParams.get("addOns"),
    subtotal: url.searchParams.get("subtotal"),
    nights: url.searchParams.get("nights"),
  });
}

export async function POST(request: Request) {
  let body: CouponValidationInput;

  try {
    body = (await request.json()) as CouponValidationInput;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Body request harus JSON valid.",
      },
      { status: 400 },
    );
  }

  return validateCoupon(body);
}

function validateCoupon(input: CouponValidationInput) {
  const code = normalizeString(input.code ?? input.promoCode).toUpperCase();

  if (!code) {
    return NextResponse.json(
      {
        error: "COUPON_CODE_REQUIRED",
        message: "Kode kupon wajib diisi.",
      },
      { status: 400 },
    );
  }

  const villaId = normalizeString(input.villaId);
  if (villaId && input.checkIn && input.checkOut) {
    const villa = getVillaById(villaId);
    if (!villa) {
      return NextResponse.json(
        {
          error: "VILLA_NOT_FOUND",
          message: "Villa tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const pricing = calculateBookingPricing(villa, {
      ...input,
      promoCode: code,
    });

    if (!pricing.ok) {
      return NextResponse.json(
        {
          error: pricing.error,
          message: pricing.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        code,
        valid: pricing.data.coupon.status === "applied",
        coupon: pricing.data.coupon,
        discountAmount: pricing.data.discountTotal,
        pricing: {
          subtotal: pricing.data.subtotal,
          extraGuestFee: pricing.data.extraGuestFee,
          addOnTotal: pricing.data.addOnTotal,
          taxableAmount: pricing.data.taxableAmount,
          total: pricing.data.total,
          payableNow: pricing.data.payableNow,
        },
      },
      meta: {
        source: "mock",
        mode: "booking-context",
      },
    });
  }

  const subtotal = parseMoney(input.subtotal, 0);
  const nights = parsePositiveInt(input.nights, 1);
  const coupon = calculateCouponDiscount(code, subtotal, nights);

  return NextResponse.json({
    data: {
      code,
      valid: coupon.status === "applied",
      coupon,
      discountAmount: coupon.amount,
      availableCoupons: couponRules.map((rule) => ({
        code: rule.code,
        label: rule.label,
        description: rule.description,
        minNights: rule.minNights,
      })),
    },
    meta: {
      source: "mock",
      mode: "standalone",
      note:
        coupon.status === "applied"
          ? "Kupon valid untuk input ini."
          : "Kupon tidak valid atau belum memenuhi syarat.",
    },
  });
}

function normalizeString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function parseMoney(value: CouponValidationInput["subtotal"], fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
}

function parsePositiveInt(value: CouponValidationInput["nights"], fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}
