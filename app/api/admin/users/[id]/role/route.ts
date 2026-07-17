import { NextResponse } from "next/server";
import { z } from "zod";
import { updateAdminUserRole } from "@/lib/admin-user-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const roleSchema = z.object({
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "RECEPTIONIST",
    "FINANCE",
    "MARKETING",
    "CUSTOMER",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actorRole = request.headers.get("x-user-role") ?? "";
  const actorId = request.headers.get("x-user-id") ?? "";
  if (!["SUPER_ADMIN", "ADMIN"].includes(actorRole))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body request harus JSON valid." },
      { status: 400 },
    );
  }
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        message: "Peran pengguna tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  if (parsed.data.role === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN")
    return NextResponse.json(
      { message: "Hanya Super Admin yang dapat memberikan peran Super Admin." },
      { status: 403 },
    );
  const { id } = await params;
  if (id === actorId)
    return NextResponse.json(
      { message: "Anda tidak dapat mengubah peran akun sendiri." },
      { status: 409 },
    );
  try {
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return notFound();
    if (current.role === "SUPER_ADMIN" && parsed.data.role !== "SUPER_ADMIN") {
      const superAdmins = await prisma.user.count({
        where: { role: "SUPER_ADMIN", status: "ACTIVE" },
      });
      if (superAdmins <= 1)
        return NextResponse.json(
          { message: "Minimal satu Super Admin aktif harus dipertahankan." },
          { status: 409 },
        );
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      user,
      message: "Peran pengguna berhasil diperbarui.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin user role API error", error);
      return NextResponse.json(
        { message: "Peran belum dapat diperbarui." },
        { status: 500 },
      );
    }
    const user = updateAdminUserRole(id, parsed.data.role);
    return user
      ? NextResponse.json({
          user,
          message: "Peran pengguna berhasil diperbarui.",
          meta: { source: "memory-fallback" },
        })
      : notFound();
  }
}

function notFound() {
  return NextResponse.json(
    { message: "Pengguna tidak ditemukan." },
    { status: 404 },
  );
}
