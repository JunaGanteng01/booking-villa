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

const bookingStore = new Map<string, BookingStoreRecord>();

export function createBookingRecord(
  record: Omit<BookingStoreRecord, "id" | "bookingCode" | "createdAt" | "updatedAt">,
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
      (booking) => booking.bookingCode.toLowerCase() === bookingCode.toLowerCase(),
    ) ?? null
  );
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
