export type AdminNotificationCategory =
  "booking" | "payment" | "review" | "guest" | "system";

export type AdminNotificationPriority = "urgent" | "attention" | "normal";

export type AdminNotification = {
  id: string;
  title: string;
  description: string;
  source: string;
  time: string;
  category: AdminNotificationCategory;
  priority: AdminNotificationPriority;
  unread: boolean;
  requiresAction: boolean;
  action: string;
  href: string;
};

export const ADMIN_NOTIFICATION_EVENT = "villaku:admin-notifications-updated";
export const ADMIN_NOTIFICATION_STORAGE_PREFIX = "villaku-admin-notifications:";

export const initialAdminNotifications: AdminNotification[] = [
  {
    id: "manual-payment-3814",
    title: "Bukti transfer baru menunggu verifikasi",
    description:
      "Maya Putri mengunggah bukti pembayaran Rp21.312.000 untuk Villa Aruna Cliffside.",
    source: "Booking VLK-260823-1482",
    time: "4 menit lalu",
    category: "payment",
    priority: "urgent",
    unread: true,
    requiresAction: true,
    action: "Verifikasi pembayaran",
    href: "/admin/payments?booking=VLK-260823-1482&action=verify",
  },
  {
    id: "booking-request-4089",
    title: "Permintaan booking baru masuk",
    description:
      "Reservasi 5 malam untuk Sagara Beach House, 8 tamu, check-in 2 September 2026.",
    source: "Booking VLK-260902-1519",
    time: "18 menit lalu",
    category: "booking",
    priority: "attention",
    unread: true,
    requiresAction: true,
    action: "Tinjau booking",
    href: "/admin/bookings?booking=VLK-260902-1519",
  },
  {
    id: "failed-payment-4002",
    title: "Pembayaran gateway gagal diproses",
    description:
      "Percobaan pembayaran kartu ditolak. Tamu sudah menerima instruksi untuk mencoba kembali.",
    source: "Booking VLK-260819-1467",
    time: "42 menit lalu",
    category: "payment",
    priority: "attention",
    unread: true,
    requiresAction: true,
    action: "Lihat detail",
    href: "/admin/payments?booking=VLK-260819-1467",
  },
  {
    id: "low-availability-ubud",
    title: "Ketersediaan Ubud menipis untuk akhir pekan",
    description:
      "Okupansi kawasan Ubud mencapai 92%. Periksa blok kalender dan kesiapan operasional villa.",
    source: "Sistem okupansi",
    time: "1 jam lalu",
    category: "system",
    priority: "attention",
    unread: true,
    requiresAction: false,
    action: "Buka villa Ubud",
    href: "/admin/villas?location=Ubud",
  },
  {
    id: "review-reported-2011",
    title: "Ulasan ditandai untuk moderasi",
    description:
      "Satu ulasan baru terdeteksi mengandung informasi pribadi dan belum ditayangkan.",
    source: "Review #RV-2011",
    time: "2 jam lalu",
    category: "review",
    priority: "normal",
    unread: true,
    requiresAction: true,
    action: "Moderasi ulasan",
    href: "/admin/reviews?review=RV-2011",
  },
  {
    id: "vip-request-993",
    title: "Permintaan khusus dari tamu Emerald",
    description:
      "Tamu meminta airport transfer dan private chef untuk malam pertama di Nara Jungle Residence.",
    source: "Maya Putri · Emerald Member",
    time: "3 jam lalu",
    category: "guest",
    priority: "normal",
    unread: false,
    requiresAction: true,
    action: "Hubungi tamu",
    href: "/admin/customers?search=Maya%20Putri",
  },
  {
    id: "review-published-1944",
    title: "Ulasan bintang lima baru dipublikasikan",
    description:
      "Sagara Beach House menerima ulasan 5.0 untuk layanan concierge dan kebersihan.",
    source: "Review #RV-2004",
    time: "Kemarin, 20.18",
    category: "review",
    priority: "normal",
    unread: false,
    requiresAction: false,
    action: "Lihat ulasan",
    href: "/admin/reviews?review=RV-2004",
  },
  {
    id: "backup-complete-771",
    title: "Sinkronisasi inventori berhasil",
    description:
      "Harga musiman dan ketersediaan 24 villa telah diperbarui tanpa konflik.",
    source: "System health",
    time: "Kemarin, 02.00",
    category: "system",
    priority: "normal",
    unread: false,
    requiresAction: false,
    action: "Lihat ringkasan",
    href: "/admin?focus=inventory",
  },
];

type PersistedNotificationState = {
  version: 1;
  readIds: string[];
  archivedIds: string[];
};

export function canViewAdminNotification(
  role: string,
  category: AdminNotificationCategory,
) {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
  if (role === "RECEPTIONIST") {
    return ["booking", "guest", "system"].includes(category);
  }
  if (role === "FINANCE") {
    return ["payment", "booking", "system"].includes(category);
  }
  if (role === "MARKETING") {
    return ["review", "guest", "system"].includes(category);
  }
  return false;
}

export function getStoredAdminNotifications(email: string) {
  const state = readPersistedState(email);
  const readIds = new Set(state.readIds);
  const archivedIds = new Set(state.archivedIds);

  return initialAdminNotifications
    .filter((notification) => !archivedIds.has(notification.id))
    .map((notification) => ({
      ...notification,
      unread: notification.unread && !readIds.has(notification.id),
    }));
}

export function persistAdminNotifications(
  email: string,
  notifications: AdminNotification[],
) {
  if (typeof window === "undefined" || !email.trim()) return;

  const currentIds = new Set(
    notifications.map((notification) => notification.id),
  );
  const readIds = notifications
    .filter((notification) => !notification.unread)
    .map((notification) => notification.id);
  const archivedIds = initialAdminNotifications
    .filter((notification) => !currentIds.has(notification.id))
    .map((notification) => notification.id);
  const state: PersistedNotificationState = {
    version: 1,
    readIds,
    archivedIds,
  };

  window.localStorage.setItem(storageKey(email), JSON.stringify(state));
  window.dispatchEvent(
    new CustomEvent(ADMIN_NOTIFICATION_EVENT, {
      detail: { email: email.trim().toLowerCase() },
    }),
  );
}

export function adminUnreadCount(role: string, email: string) {
  if (!role || !email) return 0;
  return getStoredAdminNotifications(email).filter(
    (notification) =>
      notification.unread &&
      canViewAdminNotification(role, notification.category),
  ).length;
}

function readPersistedState(email: string): PersistedNotificationState {
  const fallback: PersistedNotificationState = {
    version: 1,
    readIds: [],
    archivedIds: [],
  };
  if (typeof window === "undefined" || !email.trim()) return fallback;

  try {
    const value = JSON.parse(
      window.localStorage.getItem(storageKey(email)) ?? "null",
    ) as Partial<PersistedNotificationState> | null;
    return {
      version: 1,
      readIds: Array.isArray(value?.readIds)
        ? value.readIds.filter((id): id is string => typeof id === "string")
        : [],
      archivedIds: Array.isArray(value?.archivedIds)
        ? value.archivedIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return fallback;
  }
}

function storageKey(email: string) {
  return `${ADMIN_NOTIFICATION_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}
