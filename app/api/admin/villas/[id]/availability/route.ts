import type { AvailabilityStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  dateRange,
  listAdminAvailability,
  resetAdminAvailabilityRange,
  setAdminAvailabilityRange,
} from "@/lib/admin-availability-store";
import { getAdminVillaRecord } from "@/lib/admin-villa-store";
import { formatDateOnly, parseDateOnly } from "@/lib/booking-availability";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const rangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const updateSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["AVAILABLE", "BOOKED", "PENDING", "MAINTENANCE", "BLOCKED"]),
  priceOverride: z.number().int().min(100_000).max(100_000_000).nullable().optional(),
  minStayNights: z.number().int().min(1).max(90).default(1),
  note: z.string().trim().max(240).nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  const parsed = rangeQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) return invalidRange(parsed.error.flatten().fieldErrors);
  const range = parseRange(parsed.data.from, parsed.data.to, 366);
  if (!range.ok) return invalidRange({ range: [range.message] });

  try {
    const villa = await prisma.villa.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, slug: true, name: true },
    });
    if (!villa) return notFound();
    const stored = await prisma.villaAvailability.findMany({
      where: { villaId: villa.id, date: { gte: range.from, lte: range.to } },
      include: {
        booking: {
          select: { id: true, bookingCode: true, guestName: true, status: true },
        },
      },
      orderBy: { date: "asc" },
    });
    const byDate = new Map(stored.map((item) => [formatDateOnly(item.date), item]));
    const days = dateRange(range.from, range.to).map((date) => {
      const item = byDate.get(date);
      return item
        ? { ...item, date }
        : {
            id: null,
            villaId: villa.id,
            bookingId: null,
            date,
            status: "AVAILABLE" as const,
            priceOverride: null,
            minStayNights: 1,
            note: null,
            holdExpiresAt: null,
            bookedAt: null,
            booking: null,
          };
    });
    return availabilityResponse(villa, days, "database");
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    const villa = getAdminVillaRecord(id);
    if (!villa) return notFound();
    const days = listAdminAvailability(villa.id, range.from, range.to);
    return availabilityResponse(
      { id: villa.id, slug: villa.slug, name: villa.name },
      days,
      "memory-fallback",
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body request harus JSON valid." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Perubahan kalender tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const range = parseRange(parsed.data.from, parsed.data.to ?? parsed.data.from, 180);
  if (!range.ok) return invalidRange({ range: [range.message] });

  try {
    const villa = await prisma.villa.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!villa) return notFound();
    const protectedEntries = await prisma.villaAvailability.findMany({
      where: {
        villaId: villa.id,
        date: { gte: range.from, lte: range.to },
        bookingId: { not: null },
      },
      select: { date: true },
    });
    const protectedDates = new Set(protectedEntries.map((item) => formatDateOnly(item.date)));
    const mutableDates = dateRange(range.from, range.to).filter((date) => !protectedDates.has(date));
    const updated = await prisma.$transaction(
      mutableDates.map((date) =>
        prisma.villaAvailability.upsert({
          where: { villaId_date: { villaId: villa.id, date: parseDateOnly(date)! } },
          create: {
            villaId: villa.id,
            date: parseDateOnly(date)!,
            status: parsed.data.status,
            priceOverride: parsed.data.priceOverride ?? null,
            minStayNights: parsed.data.minStayNights,
            note: parsed.data.note ?? null,
          },
          update: {
            status: parsed.data.status,
            priceOverride: parsed.data.priceOverride ?? null,
            minStayNights: parsed.data.minStayNights,
            note: parsed.data.note ?? null,
          },
        }),
      ),
    );
    return NextResponse.json({
      updated: updated.map((item) => ({ ...item, date: formatDateOnly(item.date) })),
      summary: { updated: updated.length, protectedDates: protectedDates.size },
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    const villa = getAdminVillaRecord(id);
    if (!villa) return notFound();
    const updated = setAdminAvailabilityRange({
      villaId: villa.id,
      from: range.from,
      to: range.to,
      status: parsed.data.status,
      priceOverride: parsed.data.priceOverride ?? null,
      minStayNights: parsed.data.minStayNights,
      note: parsed.data.note ?? null,
    });
    return NextResponse.json({
      updated,
      summary: {
        updated: updated.length,
        protectedDates: dateRange(range.from, range.to).length - updated.length,
      },
      meta: { source: "memory-fallback" },
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  const parsed = rangeQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) return invalidRange(parsed.error.flatten().fieldErrors);
  const range = parseRange(parsed.data.from, parsed.data.to, 180);
  if (!range.ok) return invalidRange({ range: [range.message] });

  try {
    const villa = await prisma.villa.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!villa) return notFound();
    const [deleted, protectedDates] = await prisma.$transaction([
      prisma.villaAvailability.deleteMany({
        where: {
          villaId: villa.id,
          date: { gte: range.from, lte: range.to },
          bookingId: null,
        },
      }),
      prisma.villaAvailability.count({
        where: {
          villaId: villa.id,
          date: { gte: range.from, lte: range.to },
          bookingId: { not: null },
        },
      }),
    ]);
    return NextResponse.json({
      message: "Override kalender berhasil direset.",
      summary: { reset: deleted.count, protectedDates },
      meta: { source: "database" },
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    const villa = getAdminVillaRecord(id);
    if (!villa) return notFound();
    return NextResponse.json({
      message: "Override kalender berhasil direset.",
      summary: resetAdminAvailabilityRange(villa.id, range.from, range.to),
      meta: { source: "memory-fallback" },
    });
  }
}

function parseRange(fromValue: string, toValue: string, maxDays: number) {
  const from = parseDateOnly(fromValue);
  const to = parseDateOnly(toValue);
  if (!from || !to) return { ok: false as const, message: "Tanggal tidak valid." };
  if (to < from) return { ok: false as const, message: "Tanggal akhir harus setelah tanggal awal." };
  const days = Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (days > maxDays) return { ok: false as const, message: `Rentang maksimal ${maxDays} hari.` };
  return { ok: true as const, from, to, days };
}

function availabilityResponse(
  villa: { id: string; slug: string; name: string },
  days: Array<{ status: AvailabilityStatus; date: string }>,
  source: string,
) {
  const statuses: AvailabilityStatus[] = ["AVAILABLE", "BOOKED", "PENDING", "MAINTENANCE", "BLOCKED"];
  return NextResponse.json({
    villa,
    days,
    summary: Object.fromEntries(
      statuses.map((status) => [status, days.filter((day) => day.status === status).length]),
    ),
    meta: { source },
  });
}

function isAdmin(request: Request) {
  const role = request.headers.get("x-user-role");
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

function notFound() {
  return NextResponse.json({ message: "Villa tidak ditemukan." }, { status: 404 });
}

function invalidRange(errors: Record<string, string[] | undefined>) {
  return NextResponse.json({ message: "Rentang kalender tidak valid.", errors }, { status: 400 });
}

function serverError(error: unknown) {
  console.error("Admin availability API error", error);
  return NextResponse.json({ message: "Kalender belum dapat diproses." }, { status: 500 });
}
