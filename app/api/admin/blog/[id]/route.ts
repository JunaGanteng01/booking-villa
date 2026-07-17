import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  deleteMemoryArticle,
  getMemoryArticle,
  saveMemoryArticle,
  type BlogArticle,
} from "@/lib/admin-blog-store";
import { blogArticleSchema, toArticleValue } from "@/lib/admin-blog-validation";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  try {
    const rows = await prisma.websiteSetting.findMany({
      where: { group: "blog" },
    });
    const article = rows
      .map((row) => row.value)
      .find((value): value is Prisma.JsonObject & BlogArticle =>
        Boolean(
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          (value.id === id || value.slug === id),
        ),
      );
    return article
      ? NextResponse.json({ article, meta: { source: "database" } })
      : notFound();
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    const article = getMemoryArticle(id);
    return article
      ? NextResponse.json({ article, meta: { source: "memory-fallback" } })
      : notFound();
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body request harus JSON valid." },
      { status: 400 },
    );
  }
  const parsed = blogArticleSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        message: "Artikel belum valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  try {
    const rows = await prisma.websiteSetting.findMany({
      where: { group: "blog" },
    });
    const row = rows.find((item) => {
      const value = item.value as Record<string, unknown>;
      return value.id === id || value.slug === id;
    });
    if (!row) return notFound();
    const current = row.value as unknown as BlogArticle;
    const article = toArticleValue(parsed.data, current);
    const key = `blog:${article.slug}`;
    if (key !== row.key && rows.some((item) => item.key === key))
      return conflict();
    await prisma.$transaction([
      prisma.websiteSetting.delete({ where: { key: row.key } }),
      prisma.websiteSetting.create({
        data: {
          key,
          group: "blog",
          isPublic: article.status === "PUBLISHED",
          value: article as Prisma.InputJsonValue,
        },
      }),
    ]);
    return NextResponse.json({ article, meta: { source: "database" } });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    const current = getMemoryArticle(id);
    if (!current) return notFound();
    if (current.slug !== parsed.data.slug && getMemoryArticle(parsed.data.slug))
      return conflict();
    deleteMemoryArticle(current.id);
    return NextResponse.json({
      article: saveMemoryArticle(toArticleValue(parsed.data, current)),
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
    const rows = await prisma.websiteSetting.findMany({
      where: { group: "blog" },
    });
    const row = rows.find((item) => {
      const value = item.value as Record<string, unknown>;
      return value.id === id || value.slug === id;
    });
    if (!row) return notFound();
    await prisma.websiteSetting.delete({ where: { key: row.key } });
    return NextResponse.json({ success: true, meta: { source: "database" } });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    return deleteMemoryArticle(id)
      ? NextResponse.json({
          success: true,
          meta: { source: "memory-fallback" },
        })
      : notFound();
  }
}
function isAdmin(request: Request) {
  return ["SUPER_ADMIN", "ADMIN", "MARKETING"].includes(
    request.headers.get("x-user-role") ?? "",
  );
}
function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}
function notFound() {
  return NextResponse.json(
    { message: "Artikel tidak ditemukan." },
    { status: 404 },
  );
}
function conflict() {
  return NextResponse.json(
    { message: "Slug artikel sudah digunakan." },
    { status: 409 },
  );
}
function serverError(error: unknown) {
  console.error("Admin blog detail API error", error);
  return NextResponse.json(
    { message: "Artikel belum dapat diproses." },
    { status: 500 },
  );
}
