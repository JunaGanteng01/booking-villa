import {
  availabilityOverridesByVilla,
  formatDateOnly,
  parseDateOnly,
  type CalendarStatus,
} from "@/lib/booking-availability";

export type AdminAvailabilityRecord = {
  id: string;
  villaId: string;
  bookingId: string | null;
  date: string;
  status: CalendarStatus;
  priceOverride: number | null;
  minStayNights: number;
  note: string | null;
  updatedAt: string;
};

const globalForAvailability = globalThis as typeof globalThis & {
  villakuAdminAvailabilityStore?: Map<string, AdminAvailabilityRecord>;
};

const availabilityStore =
  globalForAvailability.villakuAdminAvailabilityStore ?? createSeedStore();

if (process.env.NODE_ENV !== "production") {
  globalForAvailability.villakuAdminAvailabilityStore = availabilityStore;
}

export function listAdminAvailability(villaId: string, from: Date, to: Date) {
  const result: AdminAvailabilityRecord[] = [];
  for (const date of dateRange(from, to)) {
    const stored = availabilityStore.get(key(villaId, date));
    result.push(
      stored ?? {
        id: `availability_${villaId}_${date}`,
        villaId,
        bookingId: null,
        date,
        status: "AVAILABLE",
        priceOverride: null,
        minStayNights: 1,
        note: null,
        updatedAt: new Date(0).toISOString(),
      },
    );
  }
  return result;
}

export function setAdminAvailabilityRange({
  villaId,
  from,
  to,
  status,
  priceOverride,
  minStayNights,
  note,
}: {
  villaId: string;
  from: Date;
  to: Date;
  status: CalendarStatus;
  priceOverride: number | null;
  minStayNights: number;
  note: string | null;
}) {
  const updated: AdminAvailabilityRecord[] = [];
  for (const date of dateRange(from, to)) {
    const existing = availabilityStore.get(key(villaId, date));
    if (existing?.bookingId) continue;
    const record: AdminAvailabilityRecord = {
      id: existing?.id ?? `availability_${villaId}_${date}`,
      villaId,
      bookingId: null,
      date,
      status,
      priceOverride,
      minStayNights,
      note,
      updatedAt: new Date().toISOString(),
    };
    availabilityStore.set(key(villaId, date), record);
    updated.push(record);
  }
  return updated;
}

export function resetAdminAvailabilityRange(villaId: string, from: Date, to: Date) {
  let reset = 0;
  let protectedDates = 0;
  for (const date of dateRange(from, to)) {
    const stored = availabilityStore.get(key(villaId, date));
    if (stored?.bookingId) {
      protectedDates += 1;
      continue;
    }
    if (availabilityStore.delete(key(villaId, date))) reset += 1;
  }
  return { reset, protectedDates };
}

export function dateRange(from: Date, to: Date) {
  const dates: string[] = [];
  for (const cursor = new Date(from); cursor <= to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(formatDateOnly(cursor));
  }
  return dates;
}

function createSeedStore() {
  const store = new Map<string, AdminAvailabilityRecord>();
  for (const [villaId, dates] of Object.entries(availabilityOverridesByVilla)) {
    for (const [date, override] of Object.entries(dates)) {
      if (!parseDateOnly(date)) continue;
      store.set(key(villaId, date), {
        id: `availability_${villaId}_${date}`,
        villaId,
        bookingId: override.status === "BOOKED" ? `demo-booking-${date}` : null,
        date,
        status: override.status,
        priceOverride: override.priceOverride ?? null,
        minStayNights: override.minStayNights ?? 1,
        note: override.note ?? null,
        updatedAt: new Date(0).toISOString(),
      });
    }
  }
  return store;
}

function key(villaId: string, date: string) {
  return `${villaId}:${date}`;
}
