import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const id = request.headers.get("x-user-id");
  const email = request.headers.get("x-user-email");
  const role = request.headers.get("x-user-role");
  const name = request.headers.get("x-user-name");

  if (!id || !email || !role) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id,
      name: name || email.split("@")[0],
      email,
      role,
    },
  });
}
