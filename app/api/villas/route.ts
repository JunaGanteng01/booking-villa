import { NextResponse } from "next/server";
import { queryVillas } from "@/lib/villa-query";

export async function GET(request: Request) {
  const result = queryVillas(new URL(request.url).searchParams);
  return NextResponse.json(result.body, { status: result.status });
}
