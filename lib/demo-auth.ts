export const DEMO_ACCOUNTS = [
  {
    id: "demo-super-admin",
    name: "Ayu Prameswari",
    label: "Super Admin",
    email: "superadmin@villaku.test",
    password: "SuperAdminVilla2026",
    role: "SUPER_ADMIN",
    destination: "/admin",
  },
  {
    id: "demo-admin",
    name: "Dimas Wicaksono",
    label: "Admin",
    email: "admin@villaku.test",
    password: "AdminVilla2026",
    role: "ADMIN",
    destination: "/admin",
  },
  {
    id: "demo-marketing",
    name: "Nadia Kusuma",
    label: "Marketing",
    email: "marketing@villaku.test",
    password: "MarketingVilla2026",
    role: "MARKETING",
    destination: "/admin/reviews",
  },
  {
    id: "demo-receptionist",
    name: "Made Surya",
    label: "Receptionist",
    email: "receptionist@villaku.test",
    password: "ReceptionVilla2026",
    role: "RECEPTIONIST",
    destination: "/admin/bookings",
  },
  {
    id: "demo-finance",
    name: "Citra Maharani",
    label: "Finance",
    email: "finance@villaku.test",
    password: "FinanceVilla2026",
    role: "FINANCE",
    destination: "/admin/payments",
  },
  {
    id: "demo-customer",
    name: "Maya Putri",
    label: "User",
    email: "maya@villaku.test",
    password: "VillaKu2026",
    role: "CUSTOMER",
    destination: "/dashboard",
  },
] as const;

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];
export type ActiveLoginRole = DemoAccount["role"];

export const STAFF_ROLES: ActiveLoginRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MARKETING",
  "RECEPTIONIST",
  "FINANCE",
];

export function isStaffRole(role: string) {
  return STAFF_ROLES.includes(role as ActiveLoginRole);
}

export function getRoleDestination(role: string) {
  return (
    DEMO_ACCOUNTS.find((account) => account.role === role)?.destination ??
    "/dashboard"
  );
}

export function getRoleLabel(role: string) {
  return (
    DEMO_ACCOUNTS.find((account) => account.role === role)?.label ?? "User"
  );
}
