import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAccessRoleRecord,
  permissionCatalog,
  updateAccessRolePermissions,
} from "@/lib/admin-rbac-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const schema = z.object({
  permissions: z.array(z.enum(permissionCatalog)).max(permissionCatalog.length),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (
    !["SUPER_ADMIN", "ADMIN"].includes(request.headers.get("x-user-role") ?? "")
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const role = await prisma.accessRole.findFirst({
      where: { OR: [{ id }, { key: id }] },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) return notFound();
    const granted = role.permissions.map((item) => item.permission.key);
    return NextResponse.json({
      role: { id: role.id, key: role.key, name: role.name },
      permissions: permissionCatalog.map((key) => ({
        key,
        module: key.split(".")[0],
        granted: granted.includes(key),
      })),
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Get role permissions API error", error);
      return NextResponse.json(
        { message: "Izin akses belum dapat dimuat." },
        { status: 500 },
      );
    }
    const role = getAccessRoleRecord(id);
    if (!role) return notFound();
    return NextResponse.json({
      role: { id: role.id, key: role.key, name: role.name },
      permissions: permissionCatalog.map((key) => ({
        key,
        module: key.split(".")[0],
        granted: role.permissions.includes(key),
      })),
      meta: { source: "memory-fallback" },
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("x-user-role") !== "SUPER_ADMIN")
    return NextResponse.json(
      { message: "Hanya Super Admin yang dapat mengubah izin." },
      { status: 403 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body request harus JSON valid." },
      { status: 400 },
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        message: "Daftar izin tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  const permissions = [...new Set(parsed.data.permissions)];
  const { id } = await params;
  try {
    const role = await prisma.accessRole.findFirst({
      where: { OR: [{ id }, { key: id }] },
    });
    if (!role) return notFound();
    if (
      role.key === "SUPER_ADMIN" &&
      permissions.length !== permissionCatalog.length
    )
      return protectedRole();
    const permissionRows = await prisma.$transaction(
      permissions.map((key) =>
        prisma.permission.upsert({
          where: { key },
          create: { key, name: label(key), module: key.split(".")[0] },
          update: {},
        }),
      ),
    );
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: permissionRows.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      }),
    ]);
    return NextResponse.json({
      role: { ...role, permissions },
      message: "Izin akses berhasil disimpan.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Role permission API error", error);
      return NextResponse.json(
        { message: "Izin belum dapat disimpan." },
        { status: 500 },
      );
    }
    const current = updateAccessRolePermissions(id, permissions);
    if (!current) return notFound();
    if (
      current.key === "SUPER_ADMIN" &&
      permissions.length !== permissionCatalog.length
    )
      return protectedRole();
    return NextResponse.json({
      role: current,
      message: "Izin akses berhasil disimpan.",
      meta: { source: "memory-fallback" },
    });
  }
}
export const PATCH = PUT;
function label(key: string) {
  return key
    .split(".")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
function notFound() {
  return NextResponse.json(
    { message: "Peran tidak ditemukan." },
    { status: 404 },
  );
}
function protectedRole() {
  return NextResponse.json(
    { message: "Izin bawaan Super Admin tidak boleh dikurangi." },
    { status: 409 },
  );
}
