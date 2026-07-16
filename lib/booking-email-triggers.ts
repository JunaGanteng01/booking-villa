import type { BookingStoreRecord } from "@/lib/booking-store";
import { sendAutomatedEmail } from "@/lib/email-service";
import { createBookingConfirmationEmail } from "@/lib/email-templates/booking-confirmation";
import { createCheckInReminderEmail } from "@/lib/email-templates/check-in-reminder";
import { createInvoiceEmail } from "@/lib/email-templates/invoice";
import { createReviewRequestEmail } from "@/lib/email-templates/review-request";

export async function triggerBookingInvoiceEmail(booking: BookingStoreRecord) {
  return deliverBookingEmail(
    "invoice",
    booking.bookingCode,
    createInvoiceEmail({
      guestName: booking.guest.name,
      guestEmail: booking.guest.email,
      invoiceNumber: `INV-${booking.bookingCode}`,
      bookingCode: booking.bookingCode,
      villaName: booking.villaName,
      issuedAt: booking.createdAt,
      dueAt: booking.expiresAt,
      lineItems: booking.lineItems.map((item) => ({
        label: item.label,
        quantity: 1,
        unitAmount: Math.abs(item.amount),
        totalAmount: item.amount,
      })),
      subtotal: booking.amounts.subtotal,
      discountAmount: booking.amounts.discountTotal,
      serviceFee: booking.amounts.serviceFee,
      taxAmount: booking.amounts.taxTotal,
      totalAmount: booking.amounts.totalAmount,
      paidAmount:
        booking.paymentStatus === "PAID" ? booking.amounts.depositAmount : 0,
      currency: booking.amounts.currency,
      invoicePath: `/api/bookings/${encodeURIComponent(booking.id)}/invoice`,
    }),
  );
}

export async function triggerBookingConfirmationEmail(booking: BookingStoreRecord) {
  return deliverBookingEmail(
    "booking-confirmation",
    booking.bookingCode,
    createBookingConfirmationEmail({
      guestName: booking.guest.name,
      guestEmail: booking.guest.email,
      bookingCode: booking.bookingCode,
      villaName: booking.villaName,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      totalAmount: booking.amounts.totalAmount,
      currency: booking.amounts.currency,
      paymentStatus:
        booking.paymentStatus === "PAID"
          ? booking.amounts.remainingAmount > 0
            ? "PARTIALLY_PAID"
            : "PAID"
          : "UNPAID",
      manageBookingPath: "/dashboard",
    }),
  );
}

export async function triggerCheckInReminderEmail(input: {
  guestName: string;
  guestEmail: string;
  bookingCode: string;
  villaName: string;
  checkIn: string | Date;
  checkOut: string | Date;
  villaAddress: string;
}) {
  return deliverBookingEmail(
    "check-in-reminder",
    input.bookingCode,
    createCheckInReminderEmail(input),
  );
}

export async function triggerReviewRequestEmail(input: {
  guestName: string;
  guestEmail: string;
  bookingCode: string;
  villaName: string;
  villaId: string;
  checkOut: string | Date;
}) {
  return deliverBookingEmail(
    "review-request",
    input.bookingCode,
    createReviewRequestEmail(input),
  );
}

async function deliverBookingEmail(
  stage: string,
  bookingCode: string,
  email: Parameters<typeof sendAutomatedEmail>[0],
) {
  try {
    const result = await sendAutomatedEmail(email);
    return { ok: true as const, result };
  } catch (error) {
    console.error(`Booking email trigger ${stage} failed for ${bookingCode}`, error);
    return { ok: false as const, error };
  }
}
