import { NextResponse } from "next/server";
import { z } from "zod";
import { updateAdminUserStatus } from "@/lib/admin-user-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]),
  reason: z.string().trim().min(5).max(1000).nullable().optional(),
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
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        message: "Status akun tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  if (parsed.data.status !== "ACTIVE" && !parsed.data.reason)
    return NextResponse.json(
      { message: "Alasan penonaktifan wajib diisi." },
      { status: 400 },
    );
  const { id } = await params;
  if (id === actorId)
    return NextResponse.json(
      { message: "Anda tidak dapat menonaktifkan akun sendiri." },
      { status: 409 },
    );
  try {
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return notFound();
    if (current.role === "SUPER_ADMIN" && parsed.data.status !== "ACTIVE") {
      const active = await prisma.user.count({
        where: { role: "SUPER_ADMIN", status: "ACTIVE" },
      });
      if (active <= 1)
        return NextResponse.json(
          { message: "Minimal satu Super Admin aktif harus dipertahankan." },
          { status: 409 },
        );
    }
    const now = new Date();
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: parsed.data.status,
        suspendedAt: parsed.data.status === "SUSPENDED" ? now : null,
        suspensionReason:
          parsed.data.status === "ACTIVE" ? null : parsed.data.reason,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        suspendedAt: true,
        suspensionReason: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      user,
      message:
        parsed.data.status === "ACTIVE"
          ? "Akun berhasil diaktifkan."
          : "Akun berhasil dinonaktifkan.",
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Admin user status API error", error);
      return NextResponse.json(
        { message: "Status akun belum dapat diperbarui." },
        { status: 500 },
      );
    }
    const user = updateAdminUserStatus(
      id,
      parsed.data.status,
      parsed.data.reason,
    );
    return user
      ? NextResponse.json({
          user,
          message: "Status akun berhasil diperbarui.",
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
