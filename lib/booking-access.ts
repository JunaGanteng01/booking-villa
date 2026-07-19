import type { BookingStoreRecord } from "@/lib/booking-store";

const defaultStaffRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "RECEPTIONIST",
  "FINANCE",
] as const;

export function canAccessBooking(
  request: Request,
  booking: BookingStoreRecord,
  staffRoles: readonly string[] = defaultStaffRoles,
) {
  const role = request.headers.get("x-user-role")?.trim() ?? "";
  if (staffRoles.includes(role)) return true;

  const userId = request.headers.get("x-user-id")?.trim() ?? "";
  const userEmail = request.headers.get("x-user-email")?.trim().toLowerCase() ?? "";
  return Boolean(
    (userId && booking.bookedBy?.userId === userId) ||
      (userEmail && booking.guest.email.toLowerCase() === userEmail),
  );
}
