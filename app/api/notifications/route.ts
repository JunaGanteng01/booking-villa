import type { Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getInMemoryNotifications,
  isNotificationDatabaseUnavailableError,
} from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z
    .enum([
      "BOOKING",
      "PAYMENT",
      "REVIEW",
      "STAY",
      "REWARD",
      "GUEST",
      "SECURITY",
      "SYSTEM",
      "PROMOTION",
    ])
    .optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  read: z.enum(["all", "read", "unread"]).default("all"),
  bookingId: z.string().trim().min(1).optional(),
  search: z.string().trim().max(120).optional(),
});

const userRoles = new Set<UserRole>([
  "SUPER_ADMIN",
  "ADMIN",
  "RECEPTIONIST",
  "FINANCE",
  "MARKETING",
  "CUSTOMER",
]);

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id")?.trim();
  const userEmail = request.headers.get("x-user-email")?.trim().toLowerCase();
  const roleHeader = request.headers.get("x-user-role")?.trim() as UserRole | undefined;

  if (!userId || !roleHeader || !userRoles.has(roleHeader)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsedQuery = notificationQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        message: "Parameter riwayat notifikasi tidak valid.",
        errors: parsedQuery.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { page, limit, category, priority, read, bookingId, search } = parsedQuery.data;
  const recipientFilters: Prisma.NotificationWhereInput[] = [{ userId }];

  if (userEmail) {
    recipientFilters.push({ recipientEmail: userEmail });
  }

  if (roleHeader !== "CUSTOMER") {
    recipientFilters.push({ recipientRole: roleHeader });
  }

  if (roleHeader === "SUPER_ADMIN") {
    recipientFilters.push({
      recipientRole: {
        in: ["ADMIN", "RECEPTIONIST", "FINANCE", "MARKETING"],
      },
    });
  }

  const audienceWhere: Prisma.NotificationWhereInput = {
    OR: recipientFilters,
  };
  const where: Prisma.NotificationWhereInput = {
    AND: [
      audienceWhere,
      category ? { category } : {},
      priority ? { priority } : {},
      bookingId ? { bookingId } : {},
      read === "read" ? { isRead: true } : {},
      read === "unread" ? { isRead: false } : {},
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  try {
    const [notifications, total, unread] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        select: {
          id: true,
          category: true,
          channel: true,
          status: true,
          priority: true,
          title: true,
          message: true,
          actionLabel: true,
          actionUrl: true,
          metadata: true,
          isRead: true,
          readAt: true,
          scheduledFor: true,
          sentAt: true,
          createdAt: true,
          booking: {
            select: {
              id: true,
              bookingCode: true,
              status: true,
              paymentStatus: true,
              villa: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          AND: [audienceWhere, { isRead: false }],
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        notifications,
        summary: {
          total,
          unread,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasPreviousPage: page > 1,
          hasNextPage: page < totalPages,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    if (isNotificationDatabaseUnavailableError(error)) {
      const roles: UserRole[] =
        roleHeader === "CUSTOMER"
          ? []
          : roleHeader === "SUPER_ADMIN"
            ? ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST", "FINANCE", "MARKETING"]
            : [roleHeader];
      const fallbackItems = getInMemoryNotifications({
        userId,
        email: userEmail,
        roles,
      }).filter((notification) => {
        if (category && notification.category !== category) return false;
        if (priority && notification.priority !== priority) return false;
        if (read === "read" && !notification.isRead) return false;
        if (read === "unread" && notification.isRead) return false;
        if (bookingId && !matchesFallbackBooking(notification.metadata, bookingId)) return false;
        if (search) {
          const haystack = `${notification.title} ${notification.message}`.toLowerCase();
          if (!haystack.includes(search.toLowerCase())) return false;
        }
        return true;
      });
      const total = fallbackItems.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const notifications = fallbackItems
        .slice((page - 1) * limit, page * limit)
        .map((notification) => ({ ...notification, booking: null }));

      return NextResponse.json(
        {
          notifications,
          summary: {
            total,
            unread: fallbackItems.filter((notification) => !notification.isRead).length,
          },
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
          },
          meta: {
            source: "memory-fallback",
            note: "PostgreSQL tidak aktif; riwayat sementara diambil dari memori server.",
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    console.error("Get notification history error", error);
    return NextResponse.json(
      { message: "Riwayat notifikasi belum dapat dimuat." },
      { status: 500 },
    );
  }
}

function matchesFallbackBooking(metadata: Prisma.JsonValue, bookingId: string) {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    !Array.isArray(metadata) &&
    metadata.bookingId === bookingId
  );
}
