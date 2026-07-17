import { NextResponse } from "next/server";
import { z } from "zod";

export const faqSchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(10).max(3000),
  category: z.string().trim().min(2).max(80),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export async function parseFaqBody(request: Request) {
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
  const parsed = faqSchema.safeParse(body);
  return parsed.success
    ? { ok: true as const, data: parsed.data }
    : {
        ok: false as const,
        response: NextResponse.json(
          {
            message: "FAQ belum valid.",
            errors: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        ),
      };
}
