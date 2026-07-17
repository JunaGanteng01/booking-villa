export type AccessRoleRecord = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
};
export const permissionCatalog = [
  "dashboard.view",
  "bookings.view",
  "bookings.manage",
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
] as const;
const now = new Date().toISOString();
const seeds: AccessRoleRecord[] = [
  {
    id: "role-super-admin",
    key: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Akses penuh ke seluruh sistem.",
    isSystem: true,
    isActive: true,
    permissions: [...permissionCatalog],
    userCount: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "role-admin",
    key: "ADMIN",
    name: "Admin",
    description: "Kelola operasional harian.",
    isSystem: true,
    isActive: true,
    permissions: permissionCatalog.filter((key) => key !== "roles.manage"),
    userCount: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "role-finance",
    key: "FINANCE",
    name: "Finance",
    description: "Kelola pembayaran dan laporan.",
    isSystem: true,
    isActive: true,
    permissions: [
      "dashboard.view",
      "bookings.view",
      "payments.view",
      "payments.manage",
      "reports.view",
    ],
    userCount: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "role-marketing",
    key: "MARKETING",
    name: "Marketing",
    description: "Kelola konten dan ulasan.",
    isSystem: true,
    isActive: true,
    permissions: [
      "dashboard.view",
      "villas.view",
      "customers.view",
      "reviews.manage",
      "reports.view",
    ],
    userCount: 1,
    createdAt: now,
    updatedAt: now,
  },
];
const globalRbac = globalThis as typeof globalThis & {
  villakuRbacStore?: Map<string, AccessRoleRecord>;
};
const store =
  globalRbac.villakuRbacStore ?? new Map(seeds.map((item) => [item.id, item]));
if (process.env.NODE_ENV !== "production") globalRbac.villakuRbacStore = store;
export const listAccessRoleRecords = () =>
  Array.from(store.values()).sort((a, b) => a.name.localeCompare(b.name));
export const getAccessRoleRecord = (id: string) =>
  store.get(id) ??
  Array.from(store.values()).find(
    (item) => item.key.toLowerCase() === id.toLowerCase(),
  ) ??
  null;
export function saveAccessRoleRecord(role: AccessRoleRecord) {
  store.set(role.id, role);
  return role;
}

export function updateAccessRolePermissions(id: string, permissions: string[]) {
  const current = getAccessRoleRecord(id);
  if (!current) return null;
  return saveAccessRoleRecord({
    ...current,
    permissions: [...new Set(permissions)],
    updatedAt: new Date().toISOString(),
  });
}
