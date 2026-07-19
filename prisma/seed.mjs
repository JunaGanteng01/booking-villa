import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
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

const roles = [
  {
    key: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Akses penuh ke seluruh sistem.",
    permissions: permissions.filter((key) => key !== "checkouts.manage"),
  },
  {
    key: "ADMIN",
    name: "Admin",
    description: "Kelola operasional harian.",
    permissions: permissions.filter(
      (key) => key !== "roles.manage" && key !== "checkouts.manage",
    ),
  },
  {
    key: "RECEPTIONIST",
    name: "Receptionist",
    description: "Kelola reservasi dan pengalaman tamu.",
    permissions: [
      "dashboard.view",
      "bookings.view",
      "bookings.manage",
      "checkouts.view",
      "checkouts.manage",
      "villas.view",
      "customers.view",
    ],
  },
  {
    key: "FINANCE",
    name: "Finance",
    description: "Kelola pembayaran dan laporan keuangan.",
    permissions: [
      "dashboard.view",
      "bookings.view",
      "payments.view",
      "payments.manage",
      "reports.view",
    ],
  },
  {
    key: "MARKETING",
    name: "Marketing",
    description: "Kelola konten, ulasan, dan insight pemasaran.",
    permissions: [
      "dashboard.view",
      "villas.view",
      "customers.view",
      "reviews.manage",
      "reports.view",
    ],
  },
  {
    key: "CUSTOMER",
    name: "Customer",
    description: "Akun tamu VillaKu.",
    permissions: [],
  },
];

const demoUsers = [
  {
    name: "Ayu Prameswari",
    email: "superadmin@villaku.test",
    password: "SuperAdminVilla2026",
    role: "SUPER_ADMIN",
    department: "Management",
  },
  {
    name: "Dimas Wicaksono",
    email: "admin@villaku.test",
    password: "AdminVilla2026",
    role: "ADMIN",
    department: "Operations",
  },
  {
    name: "Nadia Kusuma",
    email: "marketing@villaku.test",
    password: "MarketingVilla2026",
    role: "MARKETING",
    department: "Marketing",
  },
  {
    name: "Made Surya",
    email: "receptionist@villaku.test",
    password: "ReceptionVilla2026",
    role: "RECEPTIONIST",
    department: "Front Office",
  },
  {
    name: "Citra Maharani",
    email: "finance@villaku.test",
    password: "FinanceVilla2026",
    role: "FINANCE",
    department: "Finance",
  },
  {
    name: "Maya Putri",
    email: "maya@villaku.test",
    password: "VillaKu2026",
    role: "CUSTOMER",
    department: null,
  },
];

async function main() {
  const permissionIds = new Map();
  for (const key of permissions) {
    const record = await prisma.permission.upsert({
      where: { key },
      create: { key, name: label(key), module: key.split(".")[0] },
      update: { name: label(key), module: key.split(".")[0] },
    });
    permissionIds.set(key, record.id);
  }

  const roleIds = new Map();
  for (const definition of roles) {
    const role = await prisma.accessRole.upsert({
      where: { key: definition.key },
      create: {
        key: definition.key,
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
      update: {
        name: definition.name,
        description: definition.description,
        isSystem: true,
        isActive: true,
      },
    });
    roleIds.set(definition.key, role.id);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (definition.permissions.length) {
      await prisma.rolePermission.createMany({
        data: definition.permissions.map((key) => ({
          roleId: role.id,
          permissionId: permissionIds.get(key),
        })),
        skipDuplicates: true,
      });
    }
  }

  for (const definition of demoUsers) {
    const passwordHash = await bcrypt.hash(definition.password, 10);
    await prisma.user.upsert({
      where: { email: definition.email },
      create: {
        name: definition.name,
        email: definition.email,
        passwordHash,
        emailVerified: new Date(),
        role: definition.role,
        status: "ACTIVE",
        department: definition.department,
      },
      update: {
        name: definition.name,
        passwordHash,
        emailVerified: new Date(),
        role: definition.role,
        status: "ACTIVE",
        department: definition.department,
      },
    });
  }

  const users = await prisma.user.findMany({
    select: { id: true, role: true },
  });
  for (const user of users) {
    const roleId = roleIds.get(user.role);
    if (roleId) {
      await prisma.userAccessRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId } },
        create: { userId: user.id, roleId },
        update: { expiresAt: null },
      });
    }
  }
  console.log(
    `Seeded ${roles.length} roles, ${permissions.length} permissions, ${demoUsers.length} demo users, and ${users.length} user assignments.`,
  );
}

function label(key) {
  return key
    .split(".")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

main()
  .catch((error) => {
    console.error("RBAC seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
