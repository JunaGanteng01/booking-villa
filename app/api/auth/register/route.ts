import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validasi input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validationResult.data;
    
    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 409 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    
    // Simpan user ke database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        verificationToken,
        role: "CUSTOMER",
      },
    });
    
    // TODO: Kirim email verifikasi
    // Karena belum ada layanan email (misal Resend/Nodemailer), kita simulasikan:
    console.log(`[SIMULASI EMAIL] Mengirim email verifikasi ke ${email} dengan token ${verificationToken}`);
    
    return NextResponse.json(
      { 
        message: "Registrasi berhasil. Silakan cek email Anda untuk verifikasi.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
