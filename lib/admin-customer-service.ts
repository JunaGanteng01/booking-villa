import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  source: "database";
};

type CustomerAccumulator = Omit<AdminCustomer, "tier">;

const STAY_STATUSES: BookingStatus[] = ["CONFIRMED", "COMPLETED"];

export async function listAdminCustomers(): Promise<AdminCustomerResult> {
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
        status: true,
        checkOut: true,
        createdAt: true,
        payments: {
          where: { status: "PAID" },
          select: {
            amount: true,
            feeAmount: true,
            refunds: {
              where: { status: "SUCCEEDED" },
              select: { amount: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const customers = new Map<string, CustomerAccumulator>();
  const userKeyByEmail = new Map<string, string>();
  for (const user of users) {
    userKeyByEmail.set(user.email.toLowerCase(), user.id);
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
    const emailKey = booking.guestEmail.toLowerCase();
    const key =
      booking.userId ?? userKeyByEmail.get(emailKey) ?? `guest:${emailKey}`;
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
    current.phone = current.phone === "-" ? booking.guestPhone : current.phone;
    current.bookings += 1;
    current.spent += booking.payments.reduce((paymentTotal, payment) => {
      const refunded = payment.refunds.reduce(
        (refundTotal, refund) => refundTotal + refund.amount,
        0,
      );
      return (
        paymentTotal +
        Math.max(payment.amount - payment.feeAmount - refunded, 0)
      );
    }, 0);
    if (STAY_STATUSES.includes(booking.status)) {
      current.nights += booking.nights;
      current.lastStay = newestDate(
        current.lastStay,
        booking.checkOut.toISOString(),
      );
    }
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
