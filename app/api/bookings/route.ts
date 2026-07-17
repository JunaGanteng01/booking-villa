import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStayDates } from "@/lib/booking-availability";
import { triggerBookingInvoiceEmail } from "@/lib/booking-email-triggers";
import { calculateBookingPricing, type PricingInput } from "@/lib/booking-pricing";
import { createBookingRecord } from "@/lib/booking-store";
import { triggerBookingCreated } from "@/lib/notification-triggers";
import { getVillaById } from "@/lib/villa-data";

type CreateBookingInput = PricingInput & {
  villaId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  specialRequest?: string | null;
};

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id")?.trim();
  const userName = request.headers.get("x-user-name")?.trim();
  const userEmail = request.headers.get("x-user-email")?.trim().toLowerCase();
  const userRole = request.headers.get("x-user-role")?.trim() || "CUSTOMER";

  if (!userId || !userEmail) {
    return NextResponse.json(
      {
        error: "AUTH_REQUIRED",
        message: "Silakan login sebelum membuat booking.",
      },
      { status: 401 },
    );
  }

  let body: CreateBookingInput;

  try {
    body = (await request.json()) as CreateBookingInput;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Body request harus JSON valid.",
      },
      { status: 400 },
    );
  }

  const villaId = normalizeString(body.villaId);
  const guestName = userName || userEmail.split("@")[0];
  const guestEmail = userEmail;
  const guestPhone = normalizeString(body.guestPhone);
  const specialRequest = normalizeString(body.specialRequest);

  if (!villaId) {
    return NextResponse.json(
      {
        error: "VILLA_ID_REQUIRED",
        message: "villaId wajib diisi.",
      },
      { status: 400 },
    );
  }

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

  const guestValidation = validateGuest({ guestName, guestEmail, guestPhone });
  if (!guestValidation.ok) {
    return NextResponse.json(
      {
        error: "INVALID_GUEST_DATA",
        message: guestValidation.message,
      },
      { status: 400 },
    );
  }

  const pricing = calculateBookingPricing(villa, body);
  if (!pricing.ok) {
    return NextResponse.json(
      {
        error: pricing.error,
        message: pricing.message,
      },
      { status: 400 },
    );
  }

  if (!pricing.data.available) {
    return NextResponse.json(
      {
        error: "VILLA_NOT_AVAILABLE",
        message: "Tanggal menginap mengandung slot yang tidak tersedia.",
        data: {
          unavailableDates: pricing.data.unavailableDates,
        },
      },
      { status: 409 },
    );
  }

  const stayDates = getStayDates(pricing.data.checkIn, pricing.data.checkOut);
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  const booking = createBookingRecord({
    bookedBy: {
      userId,
      name: guestName,
      email: guestEmail,
      role: userRole,
    },
    villaId: villa.id,
    villaName: villa.name,
    status: "WAITING_PAYMENT",
    paymentStatus: "UNPAID",
    checkIn: pricing.data.checkIn,
    checkOut: pricing.data.checkOut,
    nights: pricing.data.nights,
    guests: pricing.data.guests,
    guest: {
      name: guestName,
      email: guestEmail,
      phone: guestPhone,
    },
    specialRequest: specialRequest || null,
    coupon: {
      code: pricing.data.coupon.code,
      status: pricing.data.coupon.status,
      amount: pricing.data.coupon.amount,
    },
    addOns: pricing.data.addOns,
    lineItems: pricing.data.lineItems,
    availabilityLocks: stayDates.map((date) => ({
      date,
      status: "PENDING",
    })),
    amounts: {
      subtotal: pricing.data.subtotal,
      extraGuestFee: pricing.data.extraGuestFee,
      addonTotal: pricing.data.addOnTotal,
      discountTotal: pricing.data.discountTotal,
      serviceFee: pricing.data.serviceFee,
      taxTotal: pricing.data.tax,
      totalAmount: pricing.data.total,
      depositAmount: pricing.data.payableNow,
      remainingAmount: pricing.data.remainingAmount,
      currency: "IDR",
    },
    expiresAt,
  });

  void triggerBookingCreated(booking);
  void triggerBookingInvoiceEmail(booking);

  return NextResponse.json(
    {
      data: {
        booking,
        nextAction: {
          type: "PAYMENT_REQUIRED",
          paymentStatus: booking.paymentStatus,
          amount: booking.amounts.depositAmount,
          expiresAt: booking.expiresAt,
        },
      },
      meta: {
        source: "mock-store",
        note: "Booking disimpan di in-memory store dan siap dipetakan ke Prisma Booking.",
      },
    },
    { status: 201 },
  );
}

function normalizeString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function validateGuest({
  guestName,
  guestEmail,
  guestPhone,
}: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}) {
  if (guestName.length < 2) {
    return { ok: false as const, message: "Nama pemesan minimal 2 karakter." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return { ok: false as const, message: "Email pemesan tidak valid." };
  }

  if (guestPhone.replace(/\D/g, "").length < 9) {
    return { ok: false as const, message: "Nomor WhatsApp minimal 9 digit." };
  }

  return { ok: true as const };
}

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            location: true,
            images: {
              where: { isCover: true },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
