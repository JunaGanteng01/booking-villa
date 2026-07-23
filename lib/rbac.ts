import type { UserRole } from "@prisma/client";

export type PermissionKey =
  | "dashboard.view"
  | "bookings.view"
  | "bookings.manage"
  | "checkouts.view"
  | "checkouts.manage"
  | "payments.view"
  | "payments.manage"
  | "villas.view"
  | "villas.manage"
  | "customers.view"
  | "reviews.manage"
  | "reports.view"
  | "settings.manage"
  | "users.manage"
  | "roles.manage";

const allPermissions: PermissionKey[] = [
  "dashboard.view",
  "bookings.view",
  "bookings.manage",
  "checkouts.view",
  "checkouts.manage",
  "payments.view",
  "payments.manage",
  "villas.view",
  "villas.manage",
  "customers.view",
  "reviews.manage",
  "reports.view",
  "settings.manage",
  "users.manage",
  "roles.manage",
];
const permissionsByRole: Record<UserRole, PermissionKey[]> = {
  SUPER_ADMIN: allPermissions.filter((permission) => permission !== "checkouts.manage"),
  ADMIN: allPermissions.filter(
    (permission) => permission !== "roles.manage" && permission !== "checkouts.manage",
  ),
  RECEPTIONIST: [
    "dashboard.view",
    "bookings.view",
    "bookings.manage",
    "checkouts.view",
    "checkouts.manage",
    "villas.view",
    "customers.view",
    "users.manage",
  ],
  FINANCE: [
    "dashboard.view",
    "bookings.view",
    "payments.view",
    "payments.manage",
    "reports.view",
  ],
  MARKETING: [
    "dashboard.view",
    "villas.view",
    "customers.view",
    "reviews.manage",
    "reports.view",
  ],
  CUSTOMER: [],
};

export function hasPermission(role: string, permission: PermissionKey) {
  return (
    role in permissionsByRole &&
    permissionsByRole[role as UserRole].includes(permission)
  );
}

export function requiredPermission(
  pathname: string,
  method: string,
): PermissionKey | null {
  const write = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  if (
    pathname.startsWith("/api/admin/roles") ||
    pathname.startsWith("/admin/users/roles")
  )
    return "roles.manage";
  if (
    pathname.startsWith("/api/admin/users") ||
    pathname.startsWith("/admin/users")
  )
    return "users.manage";
  if (
    pathname.startsWith("/api/admin/settings") ||
    pathname.startsWith("/api/admin/blog") ||
    pathname.startsWith("/api/admin/faq") ||
    pathname.startsWith("/admin/settings")
  )
    return "settings.manage";
  if (
    pathname.startsWith("/api/admin/reports") ||
    pathname.startsWith("/admin/reports")
  )
    return "reports.view";
  if (pathname.startsWith("/api/admin/analytics") || pathname === "/admin")
    return "dashboard.view";
  if (
    pathname.startsWith("/api/admin/payments") ||
    pathname.startsWith("/admin/payments")
  )
    return write ? "payments.manage" : "payments.view";
  if (
    pathname.startsWith("/api/admin/checkouts") ||
    pathname.startsWith("/admin/checkouts")
  )
    return write ? "checkouts.manage" : "checkouts.view";
  if (
    pathname.startsWith("/api/admin/bookings") ||
    pathname.startsWith("/admin/bookings")
  )
    return write ? "bookings.manage" : "bookings.view";
  if (
    pathname === "/admin/villas/new" ||
    pathname.startsWith("/admin/villas/catalog") ||
    /^\/admin\/villas\/[^/]+\/edit(?:\/|$)/.test(pathname)
  )
    return "villas.manage";
  if (
    pathname.startsWith("/api/admin/villas") ||
    pathname.startsWith("/api/admin/categories") ||
    pathname.startsWith("/api/admin/amenities") ||
    pathname.startsWith("/api/admin/promotions") ||
    pathname.startsWith("/admin/villas")
  )
    return write ? "villas.manage" : "villas.view";
  if (
    pathname.startsWith("/api/admin/reviews") ||
    pathname.startsWith("/admin/reviews")
  )
    return "reviews.manage";
  if (
    pathname.startsWith("/api/admin/customers") ||
    pathname.startsWith("/admin/customers")
  )
    return "customers.view";
  return "dashboard.view";
}
