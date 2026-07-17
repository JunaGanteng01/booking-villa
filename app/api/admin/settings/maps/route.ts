import { NextResponse } from "next/server";
import { z } from "zod";
import {
  GET as getGeneralSettings,
  PUT as updateGeneralSettings,
} from "@/app/api/admin/settings/general/route";

const mapsSchema = z.object({
  mapsApiKey: z.string().trim().max(500),
  mapLatitude: z.coerce.number().min(-90).max(90),
  mapLongitude: z.coerce.number().min(-180).max(180),
  mapZoom: z.coerce.number().int().min(1).max(22),
  mapStyle: z.enum(["roadmap", "satellite", "hybrid", "terrain"]),
  mapEnabled: z.boolean(),
});

type GeneralResponse = {
  settings: Record<string, unknown>;
  meta: { source: string };
};

export async function GET(request: Request) {
  const response = await getGeneralSettings(request);
  if (!response.ok) return response;
  const payload = (await response.json()) as GeneralResponse;
  return NextResponse.json({
    maps: pickMaps(payload.settings),
    meta: payload.meta,
  });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body request harus JSON valid." },
      { status: 400 },
    );
  }
  const parsed = mapsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Konfigurasi Google Maps tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const updateRequest = new Request(request.url, {
    method: "PUT",
    headers: request.headers,
    body: JSON.stringify({
      ...parsed.data,
      mapLatitude: String(parsed.data.mapLatitude),
      mapLongitude: String(parsed.data.mapLongitude),
      mapZoom: String(parsed.data.mapZoom),
    }),
  });
  const response = await updateGeneralSettings(updateRequest);
  if (!response.ok) return response;
  const payload = (await response.json()) as GeneralResponse;
  return NextResponse.json({
    maps: pickMaps(payload.settings),
    message: "Konfigurasi Google Maps berhasil disimpan.",
    meta: payload.meta,
  });
}

export const PATCH = PUT;

function pickMaps(settings: Record<string, unknown>) {
  return {
    mapsApiKey: settings.mapsApiKey ?? "",
    mapLatitude: Number(settings.mapLatitude ?? -8.6478),
    mapLongitude: Number(settings.mapLongitude ?? 115.1385),
    mapZoom: Number(settings.mapZoom ?? 13),
    mapStyle: settings.mapStyle ?? "roadmap",
    mapEnabled: Boolean(settings.mapEnabled),
  };
}
