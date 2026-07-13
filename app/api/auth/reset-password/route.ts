import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token tidak boleh kosong"),
  newPassword: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { token, newPassword } = validationResult.data;
    
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });
    
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { message: "Token tidak valid atau sudah kadaluarsa" },
        { status: 400 }
      );
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    
    return NextResponse.json(
      { message: "Password berhasil diperbarui. Silakan login dengan password baru Anda." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
