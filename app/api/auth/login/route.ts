import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key_change_me_in_production";

const demoAccounts = [
  {
    id: "demo-customer",
    name: "Maya Putri",
    email: "maya@villaku.test",
    password: "VillaKu2026",
    role: "CUSTOMER",
  },
  {
    id: "demo-admin",
    name: "Ayu Prameswari",
    email: "admin@villaku.test",
    password: "AdminVilla2026",
    role: "ADMIN",
  },
] as const;

type LoginUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

async function createLoginResponse(user: LoginUser) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const response = NextResponse.json(
    {
      message: "Login berhasil",
      user,
    },
    { status: 200 },
  );

  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const email = validationResult.data.email.trim().toLowerCase();
    const { password } = validationResult.data;

    const demoAuthEnabled = process.env.NODE_ENV !== "production" || process.env.DEMO_AUTH_ENABLED === "true";
    const demoAccount = demoAccounts.find((account) => account.email === email);

    if (demoAuthEnabled && demoAccount) {
      if (demoAccount.password !== password) {
        return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
      }

      return createLoginResponse({
        id: demoAccount.id,
        name: demoAccount.name,
        email: demoAccount.email,
        role: demoAccount.role,
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }
    
    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { message: "Silakan verifikasi email Anda terlebih dahulu" },
        { status: 403 }
      );
    }
    
    return createLoginResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
