import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listMemoryFaqs,
  saveMemoryFaq,
  type FaqRecord,
} from "@/lib/admin-faq-store";
import { parseFaqBody } from "@/lib/admin-faq-validation";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  active: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  if (!isAdmin(request)) return forbidden();
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success)
    return NextResponse.json(
      { message: "Filter FAQ tidak valid." },
      { status: 400 },
    );
  try {
    const rows = await prisma.websiteSetting.findMany({
      where: { group: "faq" },
      orderBy: { key: "asc" },
    });
    return response(
      rows.map((row) => row.value).filter(isFaq),
      parsed.data,
      "database",
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    return response(listMemoryFaqs(), parsed.data, "memory-fallback");
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return forbidden();
  const parsed = await parseFaqBody(request);
  if (!parsed.ok) return parsed.response;
  const now = new Date().toISOString();
  const item: FaqRecord = {
    id: `faq_${crypto.randomUUID()}`,
    ...parsed.data,
    sortOrder: parsed.data.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await prisma.websiteSetting.create({
      data: {
        key: `faq:${item.id}`,
        group: "faq",
        isPublic: item.active,
        value: item as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json(
      { faq: item, meta: { source: "database" } },
      { status: 201 },
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    return NextResponse.json(
      { faq: saveMemoryFaq(item), meta: { source: "memory-fallback" } },
      { status: 201 },
    );
  }
}

function response(
  items: FaqRecord[],
  filters: z.infer<typeof querySchema>,
  source: string,
) {
  const search = filters.search?.toLowerCase();
  const faqs = items
    .filter(
      (item) =>
        (!filters.category ||
          item.category.toLowerCase() === filters.category.toLowerCase()) &&
        (!filters.active || item.active === (filters.active === "true")) &&
        (!search ||
          `${item.question} ${item.answer}`.toLowerCase().includes(search)),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return NextResponse.json({ faqs, meta: { source, total: faqs.length } });
}
function isFaq(
  value: Prisma.JsonValue,
): value is Prisma.JsonObject & FaqRecord {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "question" in value &&
    "answer" in value,
  );
}
function isAdmin(request: Request) {
  return ["SUPER_ADMIN", "ADMIN", "MARKETING"].includes(
    request.headers.get("x-user-role") ?? "",
  );
}
function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}
function serverError(error: unknown) {
  console.error("Admin FAQ API error", error);
  return NextResponse.json(
    { message: "FAQ belum dapat diproses." },
    { status: 500 },
  );
}
