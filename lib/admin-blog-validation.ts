import { z } from "zod";

export const blogArticleSchema = z
  .object({
    title: z.string().trim().min(5).max(200),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    excerpt: z.string().trim().min(10).max(500),
    content: z.string().trim().min(20).max(100_000),
    category: z.string().trim().min(2).max(80),
    author: z.string().trim().min(2).max(120),
    status: z.enum(["PUBLISHED", "DRAFT", "SCHEDULED"]),
    coverImage: z.string().url().nullable().optional(),
    scheduledAt: z.coerce.date().nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.status === "SCHEDULED" && !value.scheduledAt)
      context.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "Tanggal publikasi wajib untuk artikel terjadwal.",
      });
  });

export function toArticleValue(
  data: z.infer<typeof blogArticleSchema>,
  current?: {
    id: string;
    views: number;
    createdAt: string;
    publishedAt: string | null;
  },
) {
  const now = new Date().toISOString();
  return {
    id: current?.id ?? `article_${crypto.randomUUID()}`,
    ...data,
    coverImage: data.coverImage ?? null,
    scheduledAt: data.scheduledAt?.toISOString() ?? null,
    publishedAt:
      data.status === "PUBLISHED" ? (current?.publishedAt ?? now) : null,
    views: current?.views ?? 0,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}
