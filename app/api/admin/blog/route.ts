import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listMemoryArticles,
  saveMemoryArticle,
  type BlogArticle,
} from "@/lib/admin-blog-store";
import { blogArticleSchema, toArticleValue } from "@/lib/admin-blog-validation";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "SCHEDULED"]).optional(),
  category: z.string().trim().max(80).optional(),
});

export async function GET(request: Request) {
  if (!isAdmin(request)) return forbidden();
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        message: "Filter artikel tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  try {
    const stored = await prisma.websiteSetting.findMany({
      where: { group: "blog" },
      orderBy: { updatedAt: "desc" },
    });
    return listResponse(
      stored.map((item) => item.value).filter(isArticle),
      parsed.data,
      "database",
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    return listResponse(listMemoryArticles(), parsed.data, "memory-fallback");
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return forbidden();
  const parsed = await parseArticle(request);
  if (!parsed.ok) return parsed.response;
  const article = toArticleValue(parsed.data);
  try {
    const exists = await prisma.websiteSetting.findUnique({
      where: { key: `blog:${article.slug}` },
    });
    if (exists) return conflict();
    await prisma.websiteSetting.create({
      data: {
        key: `blog:${article.slug}`,
        group: "blog",
        isPublic: article.status === "PUBLISHED",
        value: article as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json(
      { article, meta: { source: "database" } },
      { status: 201 },
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    if (listMemoryArticles().some((item) => item.slug === article.slug))
      return conflict();
    return NextResponse.json(
      {
        article: saveMemoryArticle(article),
        meta: { source: "memory-fallback" },
      },
      { status: 201 },
    );
  }
}

function listResponse(
  articles: BlogArticle[],
  input: z.infer<typeof querySchema>,
  source: string,
) {
  const search = input.search?.toLowerCase();
  const filtered = articles.filter(
    (item) =>
      (!input.status || item.status === input.status) &&
      (!input.category ||
        item.category.toLowerCase() === input.category.toLowerCase()) &&
      (!search ||
        `${item.title} ${item.excerpt} ${item.author}`
          .toLowerCase()
          .includes(search)),
  );
  const start = (input.page - 1) * input.limit;
  return NextResponse.json({
    articles: filtered.slice(start, start + input.limit),
    pagination: {
      page: input.page,
      limit: input.limit,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / input.limit)),
    },
    meta: { source },
  });
}

async function parseArticle(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Body request harus JSON valid." },
        { status: 400 },
      ),
    };
  }
  const parsed = blogArticleSchema.safeParse(body);
  return parsed.success
    ? { ok: true as const, data: parsed.data }
    : {
        ok: false as const,
        response: NextResponse.json(
          {
            message: "Artikel belum valid.",
            errors: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        ),
      };
}
function isArticle(
  value: Prisma.JsonValue,
): value is Prisma.JsonObject & BlogArticle {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "slug" in value &&
    "title" in value,
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
function conflict() {
  return NextResponse.json(
    { message: "Slug artikel sudah digunakan." },
    { status: 409 },
  );
}
function serverError(error: unknown) {
  console.error("Admin blog API error", error);
  return NextResponse.json(
    { message: "Artikel belum dapat diproses." },
    { status: 500 },
  );
}
