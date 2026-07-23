import { NextResponse } from "next/server";
import {
  CheckoutFlowError,
  getCheckoutBooking,
  requestWebsiteCheckout,
  serializeCheckoutBooking,
} from "@/lib/checkout-service";
import { triggerCheckoutRequested } from "@/lib/notification-triggers";
import { getDatabaseBookingRecord } from "@/lib/booking-database";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = await getCheckoutBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "BOOKING_NOT_FOUND", message: "Booking tidak ditemukan." }, { status: 404 });
  }

  const userId = request.headers.get("x-user-id")?.trim();
  const role = request.headers.get("x-user-role")?.trim();
  const staff = ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(role ?? "");
  const user = !staff && userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
    : null;
  const ownsBooking =
    booking.guest.id === userId ||
    (booking.guest.id === null &&
      user?.email.toLowerCase() === booking.guest.email.toLowerCase());
  if (!staff && !ownsBooking) {
    return NextResponse.json({ error: "FORBIDDEN", message: "Anda tidak memiliki akses ke checkout ini." }, { status: 403 });
  }

  return NextResponse.json({ data: booking, meta: { source: "database" } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = request.headers.get("x-user-role")?.trim();
  const userId = request.headers.get("x-user-id")?.trim();
  if (role !== "CUSTOMER" || !userId) {
    return NextResponse.json(
      { error: "CUSTOMER_REQUIRED", message: "Hanya User pemilik booking yang dapat mengajukan checkout." },
      { status: 403 },
    );
  }

  let body: { notes?: string | null } = {};
  try {
    body = (await request.json()) as { notes?: string | null };
  } catch {
    // Catatan bersifat opsional.
  }

  try {
    const { id } = await params;
    const record = await requestWebsiteCheckout({ bookingIdentifier: id, userId, notes: body.notes });
    const booking = serializeCheckoutBooking(record);
    const notificationBooking = await getDatabaseBookingRecord(record.id);
    if (notificationBooking) void triggerCheckoutRequested(notificationBooking);
    return NextResponse.json({
      data: booking,
      message: "Permintaan checkout dikirim. Menunggu persetujuan Receptionist.",
      meta: { source: "database" },
    });
  } catch (error) {
    return checkoutErrorResponse(error);
  }
}

function checkoutErrorResponse(error: unknown) {
  if (error instanceof CheckoutFlowError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }
  console.error("Website checkout request error", error);
  return NextResponse.json(
    { error: "CHECKOUT_REQUEST_FAILED", message: "Permintaan checkout belum dapat diproses." },
    { status: 500 },
  );
}
