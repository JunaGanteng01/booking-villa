import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createMemoryAuthUser,
  findMemoryAuthUser,
} from "@/lib/auth-memory-store";
import { DEMO_ACCOUNTS } from "@/lib/demo-auth";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password membutuhkan huruf kapital")
    .regex(/[0-9]/, "Password membutuhkan angka"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body JSON tidak valid" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Input tidak valid",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  if (
    DEMO_ACCOUNTS.some((account) => account.email.toLowerCase() === email) ||
    findMemoryAuthUser(email)
  ) {
    return emailConflict();
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return emailConflict();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        verificationToken,
        role: "CUSTOMER",
      },
    });

    return NextResponse.json(
      {
        message: "Registrasi berhasil. Silakan cek email untuk verifikasi.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        verificationRequired: true,
        meta: { source: "database" },
      },
      { status: 201 },
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Registration error:", error);
      return NextResponse.json(
        { message: "Terjadi kesalahan pada server" },
        { status: 500 },
      );
    }
  }

  const user = createMemoryAuthUser({ name, email, passwordHash });
  return NextResponse.json(
    {
      message: "Registrasi berhasil. Akun User sudah aktif.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      verificationRequired: false,
      meta: { source: "memory-fallback" },
    },
    { status: 201 },
  );
}

function emailConflict() {
  return NextResponse.json(
    { message: "Email sudah terdaftar" },
    { status: 409 },
  );
}
