import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";
import {
  getMemoryWebsiteSettings,
  resetMemoryWebsiteSettings,
  saveMemoryWebsiteSettings,
  websiteSettingsDefaults,
} from "@/lib/website-settings";

const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(180),
  supportEmail: z.string().email(),
  phone: z.string().trim().min(5).max(50),
  address: z.string().trim().min(5).max(500),
  heroEyebrow: z.string().trim().max(120),
  heroTitle: z.string().trim().min(5).max(240),
  heroDescription: z.string().trim().min(10).max(1000),
  heroImage: z.string().url(),
  announcementEnabled: z.boolean(),
  announcement: z.string().trim().max(240),
  metaTitle: z.string().trim().min(5).max(180),
  metaDescription: z.string().trim().min(20).max(500),
  metaKeywords: z.string().trim().max(500),
  canonicalUrl: z.string().url(),
  openGraphImage: z.string().url(),
  searchIndexEnabled: z.boolean(),
  mapsApiKey: z.string().max(500),
  mapLatitude: z.string().regex(/^-?\d+(\.\d+)?$/),
  mapLongitude: z.string().regex(/^-?\d+(\.\d+)?$/),
  mapZoom: z.string().regex(/^\d{1,2}$/),
  mapStyle: z.enum(["roadmap", "satellite", "hybrid", "terrain"]),
  mapEnabled: z.boolean(),
});

const patchSchema = settingsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Minimal satu pengaturan harus dikirim.",
  });

export async function GET(request: Request) {
  if (!isAdmin(request)) return forbidden();
  try {
    const stored = await prisma.websiteSetting.findUnique({
      where: { key: "general" },
    });
    const parsed = stored ? settingsSchema.safeParse(stored.value) : null;
    return NextResponse.json({
      settings: parsed?.success ? parsed.data : websiteSettingsDefaults,
      meta: { source: "database", updatedAt: stored?.updatedAt ?? null },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    return NextResponse.json({
      settings: getMemoryWebsiteSettings(),
      meta: { source: "memory-fallback" },
    });
  }
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) return forbidden();
  const input = await parseBody(request);
  if (!input.ok) return input.response;
  try {
    const current = await prisma.websiteSetting.findUnique({
      where: { key: "general" },
    });
    const currentParsed = settingsSchema.safeParse(current?.value);
    const settings = settingsSchema.parse({
      ...(currentParsed.success ? currentParsed.data : websiteSettingsDefaults),
      ...input.data,
    });
    const stored = await prisma.websiteSetting.upsert({
      where: { key: "general" },
      create: {
        key: "general",
        group: "general",
        isPublic: false,
        value: settings,
      },
      update: { value: settings as Prisma.InputJsonValue },
    });
    return NextResponse.json({
      settings,
      meta: { source: "database", updatedAt: stored.updatedAt },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    return NextResponse.json({
      settings: saveMemoryWebsiteSettings(input.data),
      meta: { source: "memory-fallback" },
    });
  }
}

export const PATCH = PUT;

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return forbidden();
  try {
    await prisma.websiteSetting.deleteMany({ where: { key: "general" } });
    return NextResponse.json({
      settings: websiteSettingsDefaults,
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    return NextResponse.json({
      settings: resetMemoryWebsiteSettings(),
      meta: { source: "memory-fallback" },
    });
  }
}

async function parseBody(request: Request) {
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message: "Pengaturan belum valid.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      ),
    };
  }
  return { ok: true as const, data: parsed.data };
}

function isAdmin(request: Request) {
  return ["SUPER_ADMIN", "ADMIN"].includes(
    request.headers.get("x-user-role") ?? "",
  );
}

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}
function serverError(error: unknown) {
  console.error("Website settings API error", error);
  return NextResponse.json(
    { message: "Pengaturan belum dapat diproses." },
    { status: 500 },
  );
}
