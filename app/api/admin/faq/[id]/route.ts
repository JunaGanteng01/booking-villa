import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  deleteMemoryFaq,
  getMemoryFaq,
  saveMemoryFaq,
  type FaqRecord,
} from "@/lib/admin-faq-store";
import { parseFaqBody } from "@/lib/admin-faq-validation";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  const parsed = await parseFaqBody(request);
  if (!parsed.ok) return parsed.response;
  try {
    const row = await prisma.websiteSetting.findUnique({
      where: { key: `faq:${id}` },
    });
    if (!row) return notFound();
    const current = row.value as unknown as FaqRecord;
    const faq = {
      ...current,
      ...parsed.data,
      sortOrder: parsed.data.sortOrder ?? current.sortOrder,
      updatedAt: new Date().toISOString(),
    };
    await prisma.websiteSetting.update({
      where: { key: row.key },
      data: { value: faq as Prisma.InputJsonValue, isPublic: faq.active },
    });
    return NextResponse.json({ faq, meta: { source: "database" } });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    const current = getMemoryFaq(id);
    if (!current) return notFound();
    return NextResponse.json({
      faq: saveMemoryFaq({
        ...current,
        ...parsed.data,
        sortOrder: parsed.data.sortOrder ?? current.sortOrder,
        updatedAt: new Date().toISOString(),
      }),
      meta: { source: "memory-fallback" },
    });
  }
}
export const PATCH = PUT;
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  try {
    const result = await prisma.websiteSetting.deleteMany({
      where: { key: `faq:${id}`, group: "faq" },
    });
    return result.count
      ? NextResponse.json({ success: true, meta: { source: "database" } })
      : notFound();
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    return deleteMemoryFaq(id)
      ? NextResponse.json({
          success: true,
          meta: { source: "memory-fallback" },
        })
      : notFound();
  }
}
function notFound() {
  return NextResponse.json(
    { message: "FAQ tidak ditemukan." },
    { status: 404 },
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
  console.error("Admin FAQ detail API error", error);
  return NextResponse.json(
    { message: "FAQ belum dapat diproses." },
    { status: 500 },
  );
}
