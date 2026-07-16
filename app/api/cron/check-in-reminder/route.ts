import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runCheckInReminderJob } from "@/lib/jobs/check-in-reminder";
import { isNotificationDatabaseUnavailableError } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleCheckInReminder(request);
}

export async function POST(request: Request) {
  return handleCheckInReminder(request);
}

async function handleCheckInReminder(request: Request) {
  const authorization = authorizeCron(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { message: authorization.message },
      { status: authorization.status },
    );
  }

  try {
    const result = await runCheckInReminderJob();

    return NextResponse.json(
      {
        message: "Job pengingat check-in H-1 selesai.",
        result,
      },
      {
        status: result.failed > 0 ? 207 : 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    if (isNotificationDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { message: "Database belum tersedia untuk menjalankan scheduler." },
        { status: 503 },
      );
    }

    console.error("Check-in reminder scheduler failed", error);
    return NextResponse.json(
      { message: "Job pengingat check-in H-1 gagal dijalankan." },
      { status: 500 },
    );
  }
}

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV === "production"
      ? {
          ok: false as const,
          status: 503,
          message: "CRON_SECRET belum dikonfigurasi.",
        }
      : { ok: true as const };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const providedBuffer = Buffer.from(authorization);
  const expectedBuffer = Buffer.from(expected);
  const matches =
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer);

  return matches
    ? { ok: true as const }
    : {
        ok: false as const,
        status: 401,
        message: "Unauthorized",
      };
}
