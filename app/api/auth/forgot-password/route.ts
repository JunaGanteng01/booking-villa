import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { email } = validationResult.data;
    
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    // Always return success even if user not found to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: "Jika email terdaftar, tautan reset password telah dikirim." },
        { status: 200 }
      );
    }
    
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
    
    // TODO: Kirim email reset password
    // Karena belum ada layanan email (misal Resend/Nodemailer), kita simulasikan:
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    console.log(`[SIMULASI EMAIL] Mengirim email reset password ke ${email} dengan link: ${resetUrl}`);
    
    return NextResponse.json(
      { message: "Jika email terdaftar, tautan reset password telah dikirim." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
