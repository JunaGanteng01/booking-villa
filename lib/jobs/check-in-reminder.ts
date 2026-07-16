import { triggerCheckInReminderEmail } from "@/lib/booking-email-triggers";
import { sendRealTimeNotification } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

const BALI_TIME_ZONE = "Asia/Makassar";
const BATCH_SIZE = 10;

export type CheckInReminderJobResult = {
  targetDate: string;
  matched: number;
  sent: number;
  failed: number;
  failures: Array<{ bookingId: string; reason: string }>;
};

export async function runCheckInReminderJob(now = new Date()): Promise<CheckInReminderJobResult> {
  const range = getBaliTomorrowRange(now);
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      checkIn: {
        gte: range.start,
        lt: range.end,
      },
    },
    select: {
      id: true,
      bookingCode: true,
      userId: true,
      guestName: true,
      guestEmail: true,
      checkIn: true,
      checkOut: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      villa: {
        select: {
          name: true,
          address: true,
          location: true,
        },
      },
    },
    orderBy: [{ checkIn: "asc" }, { id: "asc" }],
  });
  const result: CheckInReminderJobResult = {
    targetDate: range.dateKey,
    matched: bookings.length,
    sent: 0,
    failed: 0,
    failures: [],
  };

  for (let index = 0; index < bookings.length; index += BATCH_SIZE) {
    const batch = bookings.slice(index, index + BATCH_SIZE);
    const deliveries = await Promise.all(
      batch.map(async (booking) => {
        const guestEmail = booking.user?.email || booking.guestEmail;
        const guestName = booking.user?.name || booking.guestName;
        const villaAddress =
          booking.villa.address || `${booking.villa.location}, Bali, Indonesia`;
        const [emailDelivery, notificationDelivery] = await Promise.allSettled([
          triggerCheckInReminderEmail({
            guestName,
            guestEmail,
            bookingCode: booking.bookingCode,
            villaName: booking.villa.name,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            villaAddress,
          }),
          sendRealTimeNotification({
            userId: booking.userId,
            recipientEmail: guestEmail,
            category: "STAY",
            priority: "HIGH",
            title: `Check-in ${booking.villa.name} besok`,
            message: `Siapkan kode booking ${booking.bookingCode}. Check-in tersedia mulai pukul 14.00 WITA.`,
            actionLabel: "Lihat panduan kedatangan",
            actionUrl: "/dashboard/notifications",
            metadata: {
              bookingId: booking.id,
              bookingCode: booking.bookingCode,
              checkIn: booking.checkIn.toISOString(),
              villaName: booking.villa.name,
            },
            deduplicationKey: `booking:${booking.id}:checkin-reminder:${range.dateKey}`,
          }),
        ]);

        const emailOk =
          emailDelivery.status === "fulfilled" && emailDelivery.value.ok;
        const notificationOk = notificationDelivery.status === "fulfilled";

        if (emailOk && notificationOk) return { bookingId: booking.id, ok: true as const };

        return {
          bookingId: booking.id,
          ok: false as const,
          reason: buildFailureReason(emailDelivery, notificationDelivery),
        };
      }),
    );

    for (const delivery of deliveries) {
      if (delivery.ok) {
        result.sent += 1;
      } else {
        result.failed += 1;
        result.failures.push({ bookingId: delivery.bookingId, reason: delivery.reason });
      }
    }
  }

  return result;
}

export function getBaliTomorrowRange(now: Date) {
  if (Number.isNaN(now.getTime())) throw new Error("Waktu scheduler tidak valid.");

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BALI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const start = new Date(Date.UTC(year, month - 1, day + 1));
  const end = new Date(Date.UTC(year, month - 1, day + 2));

  return {
    start,
    end,
    dateKey: start.toISOString().slice(0, 10),
  };
}

function buildFailureReason(
  emailDelivery: PromiseSettledResult<Awaited<ReturnType<typeof triggerCheckInReminderEmail>>>,
  notificationDelivery: PromiseSettledResult<Awaited<ReturnType<typeof sendRealTimeNotification>>>,
) {
  const reasons: string[] = [];

  if (emailDelivery.status === "rejected") {
    reasons.push("email-error");
  } else if (!emailDelivery.value.ok) {
    reasons.push("email-not-sent");
  }
  if (notificationDelivery.status === "rejected") {
    reasons.push("notification-error");
  }

  return reasons.join(",") || "delivery-incomplete";
}
