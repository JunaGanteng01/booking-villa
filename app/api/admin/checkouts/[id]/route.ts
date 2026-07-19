import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CheckoutFlowError,
  confirmReceptionCheckout,
  serializeCheckoutBooking,
} from "@/lib/checkout-service";
import { getDatabaseBookingRecord } from "@/lib/booking-database";
import { triggerCheckoutConfirmed } from "@/lib/notification-triggers";

const confirmationSchema = z.object({
  guestVerified: z.literal(true),
  paymentVerified: z.literal(true),
  checkedOutAt: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(2000).optional().nullable(),
  channel: z.enum(["WEBSITE", "RECEPTION_DESK"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("x-user-role")?.trim() !== "RECEPTIONIST") {
    return NextResponse.json(
      { error: "RECEPTIONIST_REQUIRED", message: "Hanya Receptionist yang dapat menyelesaikan checkout." },
      { status: 403 },
    );
  }
  const receptionistId = request.headers.get("x-user-id")?.trim();
  if (!receptionistId) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Sesi Receptionist tidak valid." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON", message: "Body request harus JSON valid." }, { status: 400 });
  }
  const parsed = confirmationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_CHECKOUT_CONFIRMATION", message: "Lengkapi verifikasi tamu, pembayaran, dan waktu checkout.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const record = await confirmReceptionCheckout({
      bookingIdentifier: id,
      receptionistId,
      ...parsed.data,
      checkedOutAt: new Date(parsed.data.checkedOutAt),
    });
    const booking = serializeCheckoutBooking(record);
    const notificationBooking = await getDatabaseBookingRecord(record.id);
    if (notificationBooking) void triggerCheckoutConfirmed(notificationBooking);
    return NextResponse.json({
      data: booking,
      message: "Checkout dikonfirmasi. Reservasi selesai dan kamar kembali tersedia.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (error instanceof CheckoutFlowError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    }
    console.error("Reception checkout confirmation error", error);
    return NextResponse.json(
      { error: "CHECKOUT_CONFIRMATION_FAILED", message: "Checkout belum dapat dikonfirmasi." },
      { status: 500 },
    );
  }
}
