import type { BookingStatus } from "@prisma/client";
import { listBookingRecords } from "@/lib/booking-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export type AdminCustomer = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  country: string;
  tier: "EMERALD" | "GOLD" | "MEMBER";
  bookings: number;
  nights: number;
  spent: number;
  lastStay: string | null;
  joinedAt: string;
  verified: boolean;
  reviews: number;
};

export type AdminCustomerResult = {
  customers: AdminCustomer[];
  source: "database" | "memory-fallback";
};

type CustomerAccumulator = Omit<AdminCustomer, "tier">;

const VALUE_STATUSES: BookingStatus[] = ["CONFIRMED", "COMPLETED", "REFUNDED"];

export async function listAdminCustomers(): Promise<AdminCustomerResult> {
  try {
    const [users, bookings] = await prisma.$transaction([
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { reviews: true } },
        },
      }),
      prisma.booking.findMany({
        select: {
          userId: true,
          guestName: true,
          guestEmail: true,
          guestPhone: true,
          nights: true,
          totalAmount: true,
          status: true,
          checkOut: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const customers = new Map<string, CustomerAccumulator>();
    for (const user of users) {
      customers.set(user.id, {
        id: user.id,
        userId: user.id,
        name: user.name || user.email.split("@")[0],
        email: user.email,
        phone: "-",
        country: "Indonesia",
        bookings: 0,
        nights: 0,
        spent: 0,
        lastStay: null,
        joinedAt: user.createdAt.toISOString(),
        verified: Boolean(user.emailVerified),
        reviews: user._count.reviews,
      });
    }

    for (const booking of bookings) {
      const key = booking.userId ?? `guest:${booking.guestEmail.toLowerCase()}`;
      const current = customers.get(key) ?? {
        id: key,
        userId: booking.userId,
        name: booking.guestName,
        email: booking.guestEmail,
        phone: booking.guestPhone,
        country: "Indonesia",
        bookings: 0,
        nights: 0,
        spent: 0,
        lastStay: null,
        joinedAt: booking.createdAt.toISOString(),
        verified: false,
        reviews: 0,
      };
      current.name = current.name || booking.guestName;
      current.phone =
        current.phone === "-" ? booking.guestPhone : current.phone;
      current.bookings += 1;
      if (VALUE_STATUSES.includes(booking.status)) {
        current.nights += booking.nights;
        current.spent += booking.totalAmount;
      }
      current.lastStay = newestDate(
        current.lastStay,
        booking.checkOut.toISOString(),
      );
      current.joinedAt = oldestDate(
        current.joinedAt,
        booking.createdAt.toISOString(),
      );
      customers.set(key, current);
    }

    return {
      customers: finalizeCustomers(customers.values()),
      source: "database",
    };
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) throw error;
  }

  const customers = new Map<string, CustomerAccumulator>();
  for (const booking of listBookingRecords()) {
    const key = `guest:${booking.guest.email.toLowerCase()}`;
    const current = customers.get(key) ?? {
      id: key,
      userId: null,
      name: booking.guest.name,
      email: booking.guest.email,
      phone: booking.guest.phone,
      country: "Indonesia",
      bookings: 0,
      nights: 0,
      spent: 0,
      lastStay: null,
      joinedAt: booking.createdAt,
      verified: false,
      reviews: 0,
    };
    current.bookings += 1;
    if (VALUE_STATUSES.includes(booking.status)) {
      current.nights += booking.nights;
      current.spent += booking.amounts.totalAmount;
    }
    current.lastStay = newestDate(current.lastStay, booking.checkOut);
    current.joinedAt = oldestDate(current.joinedAt, booking.createdAt);
    customers.set(key, current);
  }
  return {
    customers: finalizeCustomers(customers.values()),
    source: "memory-fallback",
  };
}

function finalizeCustomers(
  customers: Iterable<CustomerAccumulator>,
): AdminCustomer[] {
  return Array.from(customers, (customer): AdminCustomer => ({
    ...customer,
    tier: getCustomerTier(customer.spent),
  })).sort(
    (left, right) =>
      right.spent - left.spent || right.joinedAt.localeCompare(left.joinedAt),
  );
}

function getCustomerTier(spent: number): AdminCustomer["tier"] {
  if (spent >= 100_000_000) return "EMERALD";
  if (spent >= 50_000_000) return "GOLD";
  return "MEMBER";
}

function newestDate(current: string | null, candidate: string) {
  return !current || candidate > current ? candidate : current;
}

function oldestDate(current: string, candidate: string) {
  return candidate < current ? candidate : current;
}
