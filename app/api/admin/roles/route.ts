import { NextResponse } from "next/server";
import {
  listAccessRoleRecords,
  permissionCatalog,
} from "@/lib/admin-rbac-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  if (!isAdmin(request))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  try {
    const roles = await prisma.accessRole.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({
      roles: roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        isActive: role.isActive,
        permissions: role.permissions.map((item) => item.permission.key),
        userCount: role._count.users,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
      permissions: permissionCatalog,
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin roles API error", error);
      return NextResponse.json(
        { message: "Peran belum dapat dimuat." },
        { status: 500 },
      );
    }
    return NextResponse.json({
      roles: listAccessRoleRecords(),
      permissions: permissionCatalog,
      meta: { source: "memory-fallback" },
    });
  }
}
function isAdmin(request: Request) {
  return ["SUPER_ADMIN", "ADMIN"].includes(
    request.headers.get("x-user-role") ?? "",
  );
}
