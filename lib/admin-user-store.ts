import type { UserAccountStatus, UserRole } from "@prisma/client";

export type AdminUserRecord = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserAccountStatus;
  phone: string | null;
  avatarUrl: string | null;
  department: string | null;
  emailVerified: string | null;
  lastLoginAt: string | null;
  invitedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  updatedAt: string;
};
const now = new Date().toISOString();
const seeds: AdminUserRecord[] = [
  [
    "admin-ayu",
    "Ayu Prameswari",
    "ayu@villaku.id",
    "SUPER_ADMIN",
    "ACTIVE",
    "Management",
  ],
  [
    "admin-dimas",
    "Dimas Wicaksono",
    "dimas@villaku.id",
    "ADMIN",
    "ACTIVE",
    "Operations",
  ],
  [
    "admin-nadia",
    "Nadia Kusuma",
    "nadia@villaku.id",
    "MARKETING",
    "ACTIVE",
    "Growth",
  ],
  [
    "admin-made",
    "Made Surya",
    "made@villaku.id",
    "RECEPTIONIST",
    "ACTIVE",
    "Guest Experience",
  ],
  [
    "admin-citra",
    "Citra Maharani",
    "citra@villaku.id",
    "FINANCE",
    "INVITED",
    "Finance",
  ],
  [
    "admin-bagus",
    "Bagus Ardi",
    "bagus@villaku.id",
    "ADMIN",
    "SUSPENDED",
    "Operations",
  ],
].map(([id, name, email, role, status, department]) => ({
  id,
  name,
  email,
  role: role as UserRole,
  status: status as UserAccountStatus,
  department,
  phone: null,
  avatarUrl: null,
  emailVerified: status === "ACTIVE" ? now : null,
  lastLoginAt: status === "ACTIVE" ? now : null,
  invitedAt: status === "INVITED" ? now : null,
  suspendedAt: status === "SUSPENDED" ? now : null,
  suspensionReason:
    status === "SUSPENDED" ? "Ditangguhkan oleh administrator." : null,
  createdAt: now,
  updatedAt: now,
}));
const globalUsers = globalThis as typeof globalThis & {
  villakuAdminUserStore?: Map<string, AdminUserRecord>;
};
const store =
  globalUsers.villakuAdminUserStore ??
  new Map(seeds.map((item) => [item.id, item]));
if (process.env.NODE_ENV !== "production")
  globalUsers.villakuAdminUserStore = store;
export const listAdminUserRecords = () =>
  Array.from(store.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
export const getAdminUserRecord = (id: string) =>
  store.get(id) ??
  Array.from(store.values()).find(
    (item) => item.email.toLowerCase() === id.toLowerCase(),
  ) ??
  null;
export function saveAdminUserRecord(user: AdminUserRecord) {
  store.set(user.id, user);
  return user;
}

export function updateAdminUserRole(id: string, role: UserRole) {
  const current = getAdminUserRecord(id);
  if (!current) return null;
  return saveAdminUserRecord({
    ...current,
    role,
    updatedAt: new Date().toISOString(),
  });
}

export function updateAdminUserStatus(
  id: string,
  status: UserAccountStatus,
  reason?: string | null,
) {
  const current = getAdminUserRecord(id);
  if (!current) return null;
  const now = new Date().toISOString();
  return saveAdminUserRecord({
    ...current,
    status,
    suspendedAt: status === "SUSPENDED" ? now : null,
    suspensionReason:
      status === "SUSPENDED" || status === "DEACTIVATED"
        ? (reason ?? null)
        : null,
    updatedAt: now,
  });
}

export function createAdminUserRecord(input: {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string | null;
}) {
  const now = new Date().toISOString();
  const user: AdminUserRecord = {
    id: `user_${crypto.randomUUID()}`,
    name: input.name,
    email: input.email.toLowerCase(),
    role: input.role,
    status: "INVITED",
    phone: input.phone ?? null,
    avatarUrl: null,
    department: input.department,
    emailVerified: null,
    lastLoginAt: null,
    invitedAt: now,
    suspendedAt: null,
    suspensionReason: null,
    createdAt: now,
    updatedAt: now,
  };
  return saveAdminUserRecord(user);
}
