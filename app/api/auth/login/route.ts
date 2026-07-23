import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findMemoryAuthUser } from "@/lib/auth-memory-store";
import { DEMO_ACCOUNTS } from "@/lib/demo-auth";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
  rememberMe: z.boolean().optional().default(true),
});

const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret_key_change_me_in_production";

type LoginUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

async function createLoginResponse(user: LoginUser, rememberMe: boolean) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(rememberMe ? "7d" : "12h")
    .sign(secret);

  const response = NextResponse.json(
    { message: "Login berhasil", user },
    { status: 200 },
  );

  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
    path: "/",
  });

  return response;
}

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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Input tidak valid",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, password, rememberMe } = parsed.data;
  const demoAuthEnabled = process.env.DEMO_AUTH_ENABLED !== "false";
  const demoAccount = DEMO_ACCOUNTS.find(
    (account) => account.email.toLowerCase() === email,
  );

  if (demoAuthEnabled && demoAccount) {
    if (demoAccount.password !== password) return invalidCredentials();
    return createLoginResponse(
      {
        id: demoAccount.id,
        name: demoAccount.name,
        email: demoAccount.email,
        role: demoAccount.role,
      },
      rememberMe,
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return invalidCredentials();
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { message: "Akun Anda belum aktif atau sedang ditangguhkan" },
        { status: 403 },
      );
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { message: "Silakan verifikasi email Anda terlebih dahulu" },
        { status: 403 },
      );
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return invalidCredentials();
    }
    return createLoginResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      rememberMe,
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Login error:", error);
      return NextResponse.json(
        { message: "Terjadi kesalahan pada server" },
        { status: 500 },
      );
    }
  }

  const memoryUser = findMemoryAuthUser(email);
  if (
    !memoryUser ||
    !(await bcrypt.compare(password, memoryUser.passwordHash))
  ) {
    return invalidCredentials();
  }
  return createLoginResponse(
    {
      id: memoryUser.id,
      name: memoryUser.name,
      email: memoryUser.email,
      role: memoryUser.role,
    },
    rememberMe,
  );
}

function invalidCredentials() {
  return NextResponse.json(
    { message: "Email atau password salah" },
    { status: 401 },
  );
}
