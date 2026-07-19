import type { NotificationPriority, UserRole } from "@prisma/client";
import type { BookingStoreRecord } from "@/lib/booking-store";
import {
  sendRealTimeNotification,
  type SendRealTimeNotificationInput,
} from "@/lib/notification-service";

export type PaymentEventStatus =
  | "PAID"
  | "PARTIALLY_PAID"
  | "PENDING"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "CHALLENGE"
  | "UNKNOWN";

export async function triggerBookingCreated(booking: BookingStoreRecord) {
  return deliverNotifications("booking.created", [
    {
      recipientEmail: booking.guest.email,
      category: "BOOKING",
      priority: "HIGH",
      title: `Booking ${booking.bookingCode} berhasil dibuat`,
      message: `${booking.villaName} sudah kami tahan sementara. Selesaikan pembayaran sebelum batas waktu berakhir.`,
      actionLabel: "Lanjutkan pembayaran",
      actionUrl: "/payment",
      metadata: bookingMetadata(booking),
      deduplicationKey: `booking:${booking.id}:created:guest`,
    },
    adminNotification(booking, {
      category: "BOOKING",
      priority: "HIGH",
      title: `Booking baru ${booking.bookingCode}`,
      message: `${booking.guest.name} memesan ${booking.villaName} untuk ${booking.nights} malam.`,
      actionLabel: "Lihat booking",
      actionUrl: "/admin/bookings",
      deduplicationKey: `booking:${booking.id}:created:admin`,
    }),
    roleNotification("RECEPTIONIST", booking, {
      category: "BOOKING",
      priority: "HIGH",
      title: `Booking baru ${booking.bookingCode}`,
      message: `${booking.guest.name} memesan ${booking.villaName} untuk ${booking.nights} malam.`,
      actionLabel: "Tinjau booking",
      actionUrl: "/admin/bookings",
      deduplicationKey: `booking:${booking.id}:created:receptionist`,
    }),
  ]);
}

export async function triggerCheckoutRequested(booking: BookingStoreRecord) {
  return deliverNotifications("checkout.requested", [
    {
      recipientEmail: booking.guest.email,
      category: "STAY",
      priority: "HIGH",
      title: "Permintaan checkout terkirim",
      message: `Checkout ${booking.bookingCode} menunggu persetujuan Receptionist.`,
      actionLabel: "Lihat status checkout",
      actionUrl: "/dashboard",
      metadata: { ...bookingMetadata(booking), checkoutStatus: "CHECKOUT_REQUESTED" },
      deduplicationKey: `booking:${booking.id}:checkout:requested:guest`,
    },
    roleNotification("RECEPTIONIST", booking, {
      category: "STAY",
      priority: "URGENT",
      title: `Permintaan checkout ${booking.bookingCode}`,
      message: `${booking.guest.name} meminta checkout dari ${booking.villaName}.`,
      actionLabel: "Proses checkout",
      actionUrl: "/admin/checkouts",
      deduplicationKey: `booking:${booking.id}:checkout:requested:receptionist`,
      metadata: { checkoutStatus: "CHECKOUT_REQUESTED" },
    }),
  ]);
}

export async function triggerCheckoutConfirmed(booking: BookingStoreRecord) {
  return deliverNotifications("checkout.confirmed", [
    {
      recipientEmail: booking.guest.email,
      category: "STAY",
      priority: "HIGH",
      title: "Checkout berhasil dikonfirmasi",
      message: `Masa inap ${booking.bookingCode} telah selesai. Terima kasih sudah menginap bersama Villaku.`,
      actionLabel: "Lihat riwayat",
      actionUrl: "/dashboard",
      metadata: { ...bookingMetadata(booking), checkoutStatus: "CHECKED_OUT" },
      deduplicationKey: `booking:${booking.id}:checkout:confirmed:guest`,
    },
    roleNotification("RECEPTIONIST", booking, {
      category: "STAY",
      title: `Checkout ${booking.bookingCode} selesai`,
      message: `${booking.guest.name} telah checkout dan kamar ${booking.villaName} kembali tersedia.`,
      actionLabel: "Lihat riwayat checkout",
      actionUrl: "/admin/checkouts",
      deduplicationKey: `booking:${booking.id}:checkout:confirmed:receptionist`,
      metadata: { checkoutStatus: "CHECKED_OUT" },
    }),
  ]);
}

export async function triggerPaymentMethodSelected(
  booking: BookingStoreRecord,
  paymentMethod: string,
) {
  return deliverNotifications("payment.method-selected", [
    {
      recipientEmail: booking.guest.email,
      category: "PAYMENT",
      title: "Metode pembayaran tersimpan",
      message: `${paymentMethod} dipilih untuk booking ${booking.bookingCode}.`,
      actionLabel: "Selesaikan pembayaran",
      actionUrl: "/payment",
      metadata: {
        ...bookingMetadata(booking),
        paymentMethod,
      },
      deduplicationKey: `booking:${booking.id}:payment-method:${slugify(paymentMethod)}`,
    },
  ]);
}

export async function triggerManualPaymentProofUploaded(booking: BookingStoreRecord) {
  return deliverNotifications("payment.proof-uploaded", [
    {
      recipientEmail: booking.guest.email,
      category: "PAYMENT",
      priority: "HIGH",
      title: "Bukti pembayaran diterima",
      message: `Bukti transfer untuk ${booking.bookingCode} sedang diverifikasi tim Villaku.`,
      actionLabel: "Lihat status",
      actionUrl: "/payment/status",
      metadata: bookingMetadata(booking),
      deduplicationKey: `booking:${booking.id}:payment-proof:guest`,
    },
    adminNotification(booking, {
      category: "PAYMENT",
      priority: "URGENT",
      title: `Bukti transfer ${booking.bookingCode}`,
      message: `${booking.guest.name} mengunggah bukti transfer dan menunggu verifikasi.`,
      actionLabel: "Verifikasi pembayaran",
      actionUrl: "/admin/payments",
      deduplicationKey: `booking:${booking.id}:payment-proof:admin`,
    }),
    roleNotification("FINANCE", booking, {
      category: "PAYMENT",
      priority: "URGENT",
      title: `Verifikasi pembayaran ${booking.bookingCode}`,
      message: `Bukti transfer dari ${booking.guest.name} perlu diperiksa.`,
      actionLabel: "Buka pembayaran",
      actionUrl: "/admin/payments",
      deduplicationKey: `booking:${booking.id}:payment-proof:finance`,
    }),
  ]);
}

export async function triggerPaymentStatusChanged({
  booking,
  status,
  provider,
  eventId,
}: {
  booking: BookingStoreRecord;
  status: PaymentEventStatus;
  provider: "MIDTRANS" | "STRIPE" | "MANUAL";
  eventId?: string | null;
}) {
  if (status === "UNKNOWN") return { delivered: 0, failed: 0 };

  const copy = paymentStatusCopy(status, booking);
  const eventKey = eventId?.trim() || status.toLowerCase();

  return deliverNotifications(`payment.${status.toLowerCase()}`, [
    {
      recipientEmail: booking.guest.email,
      category: "PAYMENT",
      priority: copy.priority,
      title: copy.guestTitle,
      message: copy.guestMessage,
      actionLabel: "Lihat status pembayaran",
      actionUrl: "/payment/status",
      metadata: {
        ...bookingMetadata(booking),
        provider,
        paymentEventStatus: status,
        eventId: eventId ?? null,
      },
      deduplicationKey: `booking:${booking.id}:payment:${provider.toLowerCase()}:${eventKey}:guest`,
    },
    adminNotification(booking, {
      category: "PAYMENT",
      priority: copy.priority,
      title: copy.adminTitle,
      message: copy.adminMessage,
      actionLabel: "Buka pembayaran",
      actionUrl: "/admin/payments",
      deduplicationKey: `booking:${booking.id}:payment:${provider.toLowerCase()}:${eventKey}:admin`,
      metadata: {
        provider,
        paymentEventStatus: status,
        eventId: eventId ?? null,
      },
    }),
    roleNotification("RECEPTIONIST", booking, {
      category: "PAYMENT",
      priority: copy.priority,
      title: copy.adminTitle,
      message: copy.adminMessage,
      actionLabel: "Buka booking",
      actionUrl: "/admin/bookings",
      deduplicationKey: `booking:${booking.id}:payment:${provider.toLowerCase()}:${eventKey}:receptionist`,
      metadata: {
        provider,
        paymentEventStatus: status,
        eventId: eventId ?? null,
      },
    }),
  ]);
}

async function deliverNotifications(eventName: string, notifications: SendRealTimeNotificationInput[]) {
  const results = await Promise.allSettled(notifications.map(sendRealTimeNotification));
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  for (const failure of failures) {
    console.error(`Notification trigger ${eventName} failed`, failure.reason);
  }

  return {
    delivered: results.length - failures.length,
    failed: failures.length,
  };
}

function adminNotification(
  booking: BookingStoreRecord,
  input: Omit<SendRealTimeNotificationInput, "recipientRole" | "metadata"> & {
    metadata?: Record<string, unknown>;
  },
): SendRealTimeNotificationInput {
  return roleNotification("ADMIN", booking, input);
}

function roleNotification(
  role: UserRole,
  booking: BookingStoreRecord,
  input: Omit<SendRealTimeNotificationInput, "recipientRole" | "metadata"> & {
    metadata?: Record<string, unknown>;
  },
): SendRealTimeNotificationInput {
  return {
    ...input,
    recipientRole: role,
    metadata: {
      ...bookingMetadata(booking),
      ...(input.metadata ?? {}),
    },
  };
}

function bookingMetadata(booking: BookingStoreRecord) {
  return {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    villaId: booking.villaId,
    villaName: booking.villaName,
    guestName: booking.guest.name,
    guestEmail: booking.guest.email,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    totalAmount: booking.amounts.totalAmount,
    depositAmount: booking.amounts.depositAmount,
    currency: booking.amounts.currency,
  };
}

function paymentStatusCopy(status: Exclude<PaymentEventStatus, "UNKNOWN">, booking: BookingStoreRecord) {
  const amount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(booking.amounts.depositAmount);

  const copy: Record<
    Exclude<PaymentEventStatus, "UNKNOWN">,
    {
      priority: NotificationPriority;
      guestTitle: string;
      guestMessage: string;
      adminTitle: string;
      adminMessage: string;
    }
  > = {
    PAID: {
      priority: "HIGH",
      guestTitle: "Pembayaran berhasil",
      guestMessage: `Pembayaran ${amount} untuk ${booking.bookingCode} telah diterima.`,
      adminTitle: `Pembayaran ${booking.bookingCode} berhasil`,
      adminMessage: `${booking.guest.name} telah membayar ${amount}.`,
    },
    PARTIALLY_PAID: {
      priority: "HIGH",
      guestTitle: "Deposit terverifikasi",
      guestMessage: `Deposit ${amount} untuk ${booking.bookingCode} telah diterima. Sisa pembayaran dapat diselesaikan sesuai ketentuan booking.`,
      adminTitle: `Deposit ${booking.bookingCode} terverifikasi`,
      adminMessage: `Deposit ${booking.guest.name} telah diverifikasi Finance dan booking siap ditindaklanjuti.`,
    },
    PENDING: {
      priority: "NORMAL",
      guestTitle: "Pembayaran sedang diproses",
      guestMessage: `Pembayaran untuk ${booking.bookingCode} masih menunggu konfirmasi.`,
      adminTitle: `Pembayaran ${booking.bookingCode} tertunda`,
      adminMessage: `Transaksi ${booking.guest.name} masih dalam proses.`,
    },
    CHALLENGE: {
      priority: "HIGH",
      guestTitle: "Pembayaran perlu pemeriksaan",
      guestMessage: `Transaksi ${booking.bookingCode} sedang melalui pemeriksaan keamanan.`,
      adminTitle: `Transaksi ${booking.bookingCode} dalam challenge`,
      adminMessage: `Gateway meminta pemeriksaan tambahan untuk transaksi ini.`,
    },
    FAILED: {
      priority: "URGENT",
      guestTitle: "Pembayaran belum berhasil",
      guestMessage: `Transaksi ${booking.bookingCode} gagal. Silakan pilih metode pembayaran lain.`,
      adminTitle: `Pembayaran ${booking.bookingCode} gagal`,
      adminMessage: `Transaksi ${booking.guest.name} gagal diproses gateway.`,
    },
    EXPIRED: {
      priority: "HIGH",
      guestTitle: "Sesi pembayaran berakhir",
      guestMessage: `Sesi pembayaran ${booking.bookingCode} telah kedaluwarsa.`,
      adminTitle: `Pembayaran ${booking.bookingCode} kedaluwarsa`,
      adminMessage: `Batas waktu pembayaran ${booking.guest.name} telah berakhir.`,
    },
    REFUNDED: {
      priority: "HIGH",
      guestTitle: "Refund sedang diproses",
      guestMessage: `Pengembalian dana untuk ${booking.bookingCode} telah dicatat.`,
      adminTitle: `Refund ${booking.bookingCode} dicatat`,
      adminMessage: `Pengembalian dana ${booking.guest.name} telah diproses.`,
    },
  };

  return copy[status];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
