import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminUserRecord,
  listAdminUserRecords,
} from "@/lib/admin-user-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  role: z
    .enum([
      "SUPER_ADMIN",
      "ADMIN",
      "RECEPTIONIST",
      "FINANCE",
      "MARKETING",
      "CUSTOMER",
    ])
    .optional(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"]).optional(),
  department: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "oldest", "name"]).default("newest"),
});

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(190),
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "RECEPTIONIST",
    "FINANCE",
    "MARKETING",
    "CUSTOMER",
  ]),
  department: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(64).nullable().optional(),
});

export async function GET(request: Request) {
  if (!isAdmin(request))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        message: "Filter pengguna tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  const input = parsed.data;
  const where: Prisma.UserWhereInput = {
    role: input.role,
    status: input.status,
    department: input.department
      ? { equals: input.department, mode: "insensitive" }
      : undefined,
    OR: input.search
      ? [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { department: { contains: input.search, mode: "insensitive" } },
        ]
      : undefined,
  };
  try {
    const [users, total, grouped] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          avatarUrl: true,
          department: true,
          emailVerified: true,
          lastLoginAt: true,
          invitedAt: true,
          suspendedAt: true,
          suspensionReason: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { bookings: true } },
        },
        orderBy:
          input.sort === "name"
            ? { name: "asc" }
            : { createdAt: input.sort === "oldest" ? "asc" : "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ["status"],
        orderBy: { status: "asc" },
        _count: { _all: true },
      }),
    ]);
    return response(
      users,
      total,
      grouped as unknown as Array<{ status: string; _count: { _all: number } }>,
      input.page,
      input.limit,
      "database",
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin users API error", error);
      return NextResponse.json(
        { message: "Pengguna belum dapat dimuat." },
        { status: 500 },
      );
    }
  }
  const search = input.search?.toLowerCase();
  const filtered = listAdminUserRecords().filter(
    (user) =>
      (!input.role || user.role === input.role) &&
      (!input.status || user.status === input.status) &&
      (!input.department ||
        user.department?.toLowerCase() === input.department.toLowerCase()) &&
      (!search ||
        `${user.name ?? ""} ${user.email} ${user.department ?? ""}`
          .toLowerCase()
          .includes(search)),
  );
  filtered.sort((a, b) =>
    input.sort === "name"
      ? (a.name ?? "").localeCompare(b.name ?? "")
      : input.sort === "oldest"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
  );
  const start = (input.page - 1) * input.limit;
  const grouped = listAdminUserRecords().map((user) => ({
    status: user.status,
    _count: { _all: 1 },
  }));
  return response(
    filtered.slice(start, start + input.limit),
    filtered.length,
    grouped,
    input.page,
    input.limit,
    "memory-fallback",
  );
}

export async function POST(request: Request) {
  const actorRole = request.headers.get("x-user-role") ?? "";
  if (!["SUPER_ADMIN", "ADMIN"].includes(actorRole)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body request harus JSON valid." },
      { status: 400 },
    );
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data pengguna belum valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  if (parsed.data.role === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Hanya Super Admin yang dapat menambah Super Admin." },
      { status: 403 },
    );
  }

  try {
    const user = await prisma.user.create({
      data: {
        ...parsed.data,
        phone: parsed.data.phone || null,
        status: "INVITED",
        invitedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        department: true,
        invitedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json(
      {
        user,
        message: "Pengguna berhasil ditambahkan dan siap diundang.",
        meta: { source: "database" },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return emailConflict();
    }
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Create admin user API error", error);
      return NextResponse.json(
        { message: "Pengguna belum dapat ditambahkan." },
        { status: 500 },
      );
    }
    if (
      listAdminUserRecords().some(
        (user) => user.email.toLowerCase() === parsed.data.email,
      )
    ) {
      return emailConflict();
    }
    return NextResponse.json(
      {
        user: createAdminUserRecord(parsed.data),
        message: "Pengguna berhasil ditambahkan dan siap diundang.",
        meta: { source: "memory-fallback" },
      },
      { status: 201 },
    );
  }
}

function response(
  users: unknown[],
  total: number,
  grouped: Array<{ status: string; _count: { _all: number } }>,
  page: number,
  limit: number,
  source: string,
) {
  const counts = { ACTIVE: 0, INVITED: 0, SUSPENDED: 0, DEACTIVATED: 0 };
  grouped.forEach((item) => {
    if (item.status in counts)
      counts[item.status as keyof typeof counts] += item._count._all;
  });
  return NextResponse.json({
    users,
    summary: {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      ...counts,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    meta: { source },
  });
}
function isAdmin(request: Request) {
  return ["SUPER_ADMIN", "ADMIN"].includes(
    request.headers.get("x-user-role") ?? "",
  );
}

function emailConflict() {
  return NextResponse.json(
    { message: "Email sudah digunakan oleh pengguna lain." },
    { status: 409 },
  );
}
