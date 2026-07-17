import { NextResponse } from "next/server";
import { listAdminCustomers } from "@/lib/admin-customer-service";
import { hasPermission } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const { customers, source } = await listAdminCustomers();
    const customer = customers.find(
      (item) => item.id === id || item.email.toLowerCase() === id.toLowerCase(),
    );
    if (!customer) {
      return NextResponse.json(
        { message: "Pelanggan tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json({ customer, meta: { source } });
  } catch (error) {
    console.error("Admin customer detail API error", error);
    return NextResponse.json(
      { message: "Detail pelanggan belum dapat dimuat." },
      { status: 500 },
    );
  }
}

function isAdmin(request: Request) {
  return hasPermission(
    request.headers.get("x-user-role") ?? "",
    "customers.view",
  );
}
