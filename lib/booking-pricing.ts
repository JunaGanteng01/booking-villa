import {
  buildAvailabilityDays,
  parseDateOnly,
  validateDateRange,
} from "@/lib/booking-availability";
import type { Villa } from "@/lib/villa-data";

export type PricingInput = {
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | string | null;
  promoCode?: string | null;
  addOns?: string[] | string | null;
};

export const bookingAddOnCatalog = [
  {
    id: "airport-pickup",
    label: "Airport pickup",
    price: 450000,
  },
  {
    id: "floating-breakfast",
    label: "Floating breakfast",
    price: 350000,
  },
  {
    id: "private-chef",
    label: "Private chef dinner",
    price: 1250000,
  },
];

export const couponRules = [
  {
    code: "VILLAKU10",
    label: "Diskon promo VILLAKU10",
    description: "Diskon 10% tarif menginap, maksimal Rp1jt.",
    type: "percent" as const,
    value: 10,
    maxDiscount: 1_000_000,
    minNights: 2,
  },
  {
    code: "EARLYBIRD",
    label: "Diskon early bird",
    description: "Diskon 15% untuk booking minimal 3 malam.",
    type: "percent" as const,
    value: 15,
    maxDiscount: 1_500_000,
    minNights: 3,
  },
  {
    code: "STAY4",
    label: "Diskon long stay",
    description: "Potongan Rp750rb untuk minimal 4 malam.",
    type: "fixed" as const,
    value: 750_000,
    minNights: 4,
  },
];

export function calculateBookingPricing(villa: Villa, input: PricingInput) {
  const checkIn = normalizeString(input.checkIn);
  const checkOut = normalizeString(input.checkOut);
  const validation = validateDateRange(checkIn, checkOut);

  if (!validation.ok) {
    return {
      ok: false as const,
      error: "INVALID_DATE_RANGE",
      message: validation.message,
    };
  }

  const guests = parsePositiveInt(input.guests, 1);
  if (guests > villa.guests) {
    return {
      ok: false as const,
      error: "CAPACITY_EXCEEDED",
      message: `Kapasitas maksimal ${villa.guests} tamu.`,
    };
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
  const available = unavailableDates.length === 0 && validation.nights >= minimumStayRequirement;
  const nightlyRates = days.map((day) => {
    const date = parseDateOnly(day.date);
    const isWeekend = date ? [5, 6].includes(date.getUTCDay()) : false;
    const amount = day.pricePerNight ?? (isWeekend ? Math.round(villa.price * 1.12) : villa.price);

    return {
      date: day.date,
      amount,
      status: day.status,
      type: day.pricePerNight && day.pricePerNight !== villa.price ? "override" : isWeekend ? "weekend" : "base",
    };
  });
  const subtotal = nightlyRates.reduce((sum, rate) => sum + rate.amount, 0);
  const includedGuests = Math.min(villa.guests, 4);
  const extraGuestCount = Math.max(0, guests - includedGuests);
  const extraGuestRate = Math.round(villa.price * 0.06);
  const extraGuestFee = validation.nights * extraGuestCount * extraGuestRate;
  const selectedAddOns = normalizeAddOns(input.addOns).map((id) =>
    bookingAddOnCatalog.find((addOn) => addOn.id === id),
  );
  const validAddOns = selectedAddOns.filter((addOn): addOn is (typeof bookingAddOnCatalog)[number] =>
    Boolean(addOn),
  );
  const addOnTotal = validAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const promoCode = normalizeString(input.promoCode).toUpperCase();
  const discountBase = subtotal + extraGuestFee;
  const coupon = calculateCouponDiscount(promoCode, discountBase, validation.nights);
  const taxableAmount = Math.max(0, subtotal + extraGuestFee + addOnTotal - coupon.amount);
  const serviceFee = Math.round(taxableAmount * 0.05);
  const tax = Math.round(taxableAmount * 0.11);
  const total = taxableAmount + serviceFee + tax;
  const payableNow = Math.round(total * 0.3);

  return {
    ok: true as const,
    data: {
      villaId: villa.id,
      villaName: villa.name,
      currency: "IDR",
      checkIn,
      checkOut,
      guests,
      nights: validation.nights,
      available,
      unavailableDates,
      minimumStayRequirement,
      nightlyRates,
      includedGuests,
      extraGuestCount,
      extraGuestRate,
      addOns: validAddOns,
      coupon,
      lineItems: [
        {
          code: "room_subtotal",
          type: "ROOM",
          label: `Subtotal ${validation.nights} malam`,
          amount: subtotal,
        },
        {
          code: "extra_guest",
          type: "EXTRA_GUEST",
          label: `${extraGuestCount} tamu tambahan`,
          amount: extraGuestFee,
        },
        {
          code: "add_ons",
          type: "ADD_ON",
          label: "Add-on layanan",
          amount: addOnTotal,
        },
        {
          code: "coupon_discount",
          type: "DISCOUNT",
          label: coupon.label,
          amount: -coupon.amount,
        },
        {
          code: "service_fee",
          type: "SERVICE_FEE",
          label: "Service fee 5%",
          amount: serviceFee,
        },
        {
          code: "tax",
          type: "TAX",
          label: "Pajak 11%",
          amount: tax,
        },
      ].filter((item) => item.amount !== 0),
      subtotal,
      extraGuestFee,
      addOnTotal,
      discountTotal: coupon.amount,
      taxableAmount,
      serviceFee,
      tax,
      total,
      payableNow,
      remainingAmount: total - payableNow,
    },
  };
}

export function calculateCouponDiscount(code: string, baseAmount: number, nights: number) {
  if (!code) {
    return {
      code: null,
      status: "empty" as const,
      label: "Diskon",
      description: "Tidak ada kupon diterapkan.",
      amount: 0,
    };
  }

  const rule = couponRules.find((coupon) => coupon.code === code);
  if (!rule) {
    return {
      code,
      status: "invalid" as const,
      label: "Kupon tidak ditemukan",
      description: "Kode kupon tidak tersedia di data mock.",
      amount: 0,
    };
  }

  if (nights < rule.minNights) {
    return {
      code,
      status: "ineligible" as const,
      label: rule.label,
      description: `Kupon membutuhkan minimal ${rule.minNights} malam.`,
      amount: 0,
    };
  }

  const rawDiscount =
    rule.type === "percent"
      ? Math.round(baseAmount * (rule.value / 100))
      : rule.value;
  const amount = Math.min(rawDiscount, rule.maxDiscount ?? rawDiscount, baseAmount);

  return {
    code,
    status: "applied" as const,
    label: rule.label,
    description: rule.description,
    amount,
  };
}

function normalizeString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInt(value: PricingInput["guests"], fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function normalizeAddOns(value: PricingInput["addOns"]) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => item.split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}
