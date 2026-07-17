import { NextResponse } from "next/server";
import { z } from "zod";
import { listAdminCustomers } from "@/lib/admin-customer-service";
import { hasPermission } from "@/lib/rbac";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  tier: z.enum(["EMERALD", "GOLD", "MEMBER"]).optional(),
  verified: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  if (!isAdmin(request)) return forbidden();
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Filter pelanggan tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const { customers, source } = await listAdminCustomers();
    const { page, limit, search, tier, verified } = parsed.data;
    const normalizedSearch = search?.toLocaleLowerCase("id-ID");
    const filtered = customers.filter((customer) => {
      if (tier && customer.tier !== tier) return false;
      if (verified && customer.verified !== (verified === "true")) return false;
      return (
        !normalizedSearch ||
        `${customer.name} ${customer.email} ${customer.phone}`
          .toLocaleLowerCase("id-ID")
          .includes(normalizedSearch)
      );
    });
    const start = (page - 1) * limit;
    return NextResponse.json({
      customers: filtered.slice(start, start + limit),
      summary: {
        totalCustomers: customers.length,
        verifiedCustomers: customers.filter((customer) => customer.verified)
          .length,
        totalBookings: customers.reduce(
          (total, customer) => total + customer.bookings,
          0,
        ),
        totalSpent: customers.reduce(
          (total, customer) => total + customer.spent,
          0,
        ),
      },
      pagination: pagination(page, limit, filtered.length),
      meta: { source },
    });
  } catch (error) {
    console.error("Admin customer API error", error);
    return NextResponse.json(
      { message: "Data pelanggan belum dapat dimuat." },
      { status: 500 },
    );
  }
}

function pagination(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

function isAdmin(request: Request) {
  return hasPermission(
    request.headers.get("x-user-role") ?? "",
    "customers.view",
  );
}

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}
