import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=MissingToken', baseUrl));
    }
    
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });
    
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=InvalidToken', baseUrl));
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
      },
    });
    
    return NextResponse.redirect(new URL('/login?verified=true', baseUrl));
  } catch (error) {
    console.error("Verification error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    return NextResponse.redirect(new URL('/login?error=ServerError', baseUrl));
  }
}
