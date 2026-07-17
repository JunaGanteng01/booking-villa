import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasPermission, requiredPermission } from "@/lib/rbac";

const adminRoutes = ["/admin", "/api/admin"];
const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret_key_change_me_in_production";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const permission = isAdminRoute ? requiredPermission(pathname, request.method) : null;
    if (isAdminRoute && (!permission || !hasPermission(String(payload.role ?? ""), permission))) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Forbidden", requiredPermission: permission }, { status: 403 });
      }

      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(payload.id ?? ""));
    requestHeaders.set("x-user-name", String(payload.name ?? ""));
    requestHeaders.set("x-user-role", String(payload.role ?? ""));
    requestHeaders.set("x-user-email", String(payload.email ?? ""));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wishlist/:path*",
    "/booking/:path*",
    "/payment/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/api/user/:path*",
    "/api/auth/session",
    "/api/bookings/:path*",
    "/api/admin/:path*",
    "/api/notifications/:path*",
  ],
};
