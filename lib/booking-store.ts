import type { CalendarStatus } from "@/lib/booking-availability";

export type BookingStoreLineItem = {
  code: string;
  type: string;
  label: string;
  amount: number;
};

export type BookingStoreRecord = {
  id: string;
  bookingCode: string;
  bookedBy?: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  villaId: string;
  villaName: string;
  status:
    | "DRAFT"
    | "PENDING"
    | "WAITING_PAYMENT"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "EXPIRED"
    | "REFUNDED";
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "FAILED" | "REFUNDED";
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  guest: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequest: string | null;
  coupon: {
    code: string | null;
    status: string;
    amount: number;
  };
  addOns: Array<{
    id: string;
    label: string;
    price: number;
  }>;
  lineItems: BookingStoreLineItem[];
  availabilityLocks: Array<{
    date: string;
    status: CalendarStatus;
  }>;
  amounts: {
    subtotal: number;
    extraGuestFee: number;
    addonTotal: number;
    discountTotal: number;
    serviceFee: number;
    taxTotal: number;
    totalAmount: number;
    depositAmount: number;
    remainingAmount: number;
    currency: "IDR";
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type BookingStatusHistoryRecord = {
  id: string;
  bookingId: string;
  actorId: string | null;
  fromStatus: BookingStoreRecord["status"];
  toStatus: BookingStoreRecord["status"];
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const globalBookingStore = globalThis as typeof globalThis & {
  villakuBookingStore?: Map<string, BookingStoreRecord>;
  villakuBookingStatusHistory?: Map<string, BookingStatusHistoryRecord[]>;
};

const bookingStore = globalBookingStore.villakuBookingStore ?? new Map<string, BookingStoreRecord>();
const bookingStatusHistory =
  globalBookingStore.villakuBookingStatusHistory ?? new Map<string, BookingStatusHistoryRecord[]>();

globalBookingStore.villakuBookingStore = bookingStore;
globalBookingStore.villakuBookingStatusHistory = bookingStatusHistory;

export function createBookingRecord(
  record: Omit<
    BookingStoreRecord,
    "id" | "bookingCode" | "createdAt" | "updatedAt"
  >,
) {
  const now = new Date().toISOString();
  const bookingCode = createBookingCode();
  const id = `booking_${bookingCode.toLowerCase()}`;
  const booking: BookingStoreRecord = {
    ...record,
    id,
    bookingCode,
    createdAt: now,
    updatedAt: now,
  };

  bookingStore.set(booking.id, booking);
  return booking;
}

export function getBookingById(id: string) {
  return bookingStore.get(id) ?? null;
}

export function getBookingByCode(bookingCode: string) {
  return (
    Array.from(bookingStore.values()).find(
      (booking) =>
        booking.bookingCode.toLowerCase() === bookingCode.toLowerCase(),
    ) ?? null
  );
}

export function findBookingRecord(identifier: string) {
  return getBookingById(identifier) ?? getBookingByCode(identifier);
}

export function listBookingRecords() {
  return Array.from(bookingStore.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function removeBookingRecord(bookingId: string) {
  bookingStatusHistory.delete(bookingId);
  return bookingStore.delete(bookingId);
}

export function updateBookingStatus({
  bookingId,
  status,
  actorId,
  reason,
  metadata,
}: {
  bookingId: string;
  status: BookingStoreRecord["status"];
  actorId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const booking = bookingStore.get(bookingId);
  if (!booking) return null;

  const now = new Date().toISOString();
  const availabilityStatus = statusToAvailability(status);
  const updated: BookingStoreRecord = {
    ...booking,
    status,
    expiresAt:
      status === "CONFIRMED" || status === "CANCELLED" ? "" : booking.expiresAt,
    availabilityLocks: availabilityStatus
      ? booking.availabilityLocks.map((lock) => ({
          ...lock,
          status: availabilityStatus,
        }))
      : booking.availabilityLocks,
    updatedAt: now,
  };
  const history: BookingStatusHistoryRecord = {
    id: `history_${booking.id}_${Date.now()}`,
    bookingId: booking.id,
    actorId: actorId ?? null,
    fromStatus: booking.status,
    toStatus: status,
    reason: reason ?? null,
    metadata: metadata ?? null,
    createdAt: now,
  };

  bookingStore.set(booking.id, updated);
  bookingStatusHistory.set(booking.id, [
    history,
    ...(bookingStatusHistory.get(booking.id) ?? []),
  ]);
  return { booking: updated, history };
}

export function listBookingStatusHistory(bookingId: string) {
  return bookingStatusHistory.get(bookingId) ?? [];
}

export function updateBookingPaymentState(
  bookingId: string,
  state: {
    status?: BookingStoreRecord["status"];
    paymentStatus?: BookingStoreRecord["paymentStatus"];
  },
) {
  const booking = bookingStore.get(bookingId);
  if (!booking) return null;

  const updated: BookingStoreRecord = {
    ...booking,
    status: state.status ?? booking.status,
    paymentStatus: state.paymentStatus ?? booking.paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  bookingStore.set(bookingId, updated);
  return updated;
}

function createBookingCode() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  const time = Date.now().toString().slice(-6);
  return `VK-${time}-${random}`;
}

function statusToAvailability(
  status: BookingStoreRecord["status"],
): CalendarStatus | null {
  if (status === "CONFIRMED" || status === "COMPLETED") return "BOOKED";
  if (status === "PENDING" || status === "WAITING_PAYMENT") return "PENDING";
  if (status === "CANCELLED" || status === "EXPIRED" || status === "REFUNDED") {
    return "AVAILABLE";
  }
  return null;
}
