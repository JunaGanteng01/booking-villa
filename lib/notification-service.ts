import type {
  Notification,
  NotificationCategory,
  NotificationPriority,
  UserRole,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationAudience = {
  userId?: string;
  email?: string;
  roles?: UserRole[];
};

export type RealTimeNotificationEvent = {
  id: string;
  type: "notification.created";
  occurredAt: string;
  notification: Notification;
};

export type NotificationListener = (event: RealTimeNotificationEvent) => void;

export type SendRealTimeNotificationInput = {
  userId?: string | null;
  bookingId?: string | null;
  recipientEmail?: string | null;
  recipientRole?: UserRole | null;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  metadata?: Prisma.InputJsonValue;
  deduplicationKey?: string | null;
};

export type SendRealTimeNotificationResult = {
  notification: Notification;
  deliveredInProcess: number;
  deduplicated: boolean;
  persisted: boolean;
};

type Subscription = {
  audience: NotificationAudience;
  listener: NotificationListener;
};

class NotificationHub {
  private readonly subscriptions = new Map<string, Subscription>();

  subscribe(audience: NotificationAudience, listener: NotificationListener) {
    assertAudience(audience);

    const subscriptionId = crypto.randomUUID();
    this.subscriptions.set(subscriptionId, { audience, listener });

    return () => {
      this.subscriptions.delete(subscriptionId);
    };
  }

  publish(notification: Notification) {
    const event: RealTimeNotificationEvent = {
      id: notification.id,
      type: "notification.created",
      occurredAt: new Date().toISOString(),
      notification,
    };
    let delivered = 0;

    for (const { audience, listener } of this.subscriptions.values()) {
      if (!matchesAudience(notification, audience)) continue;

      delivered += 1;
      try {
        listener(event);
      } catch (error) {
        console.error("Notification listener failed", error);
      }
    }

    return delivered;
  }
}

const globalForNotifications = globalThis as typeof globalThis & {
  villakuNotificationHub?: NotificationHub;
  villakuFallbackNotifications?: Map<string, Notification>;
};

const notificationHub =
  globalForNotifications.villakuNotificationHub ?? new NotificationHub();
const fallbackNotifications =
  globalForNotifications.villakuFallbackNotifications ?? new Map<string, Notification>();

if (process.env.NODE_ENV !== "production") {
  globalForNotifications.villakuNotificationHub = notificationHub;
  globalForNotifications.villakuFallbackNotifications = fallbackNotifications;
}

export function subscribeToNotifications(
  audience: NotificationAudience,
  listener: NotificationListener,
) {
  return notificationHub.subscribe(audience, listener);
}

export function publishPersistedNotification(notification: Notification) {
  return notificationHub.publish(notification);
}

export function getInMemoryNotifications(audience: NotificationAudience) {
  assertAudience(audience);

  return Array.from(fallbackNotifications.values())
    .filter((notification) => matchesAudience(notification, audience))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function sendRealTimeNotification(
  input: SendRealTimeNotificationInput,
): Promise<SendRealTimeNotificationResult> {
  const normalized = normalizeInput(input);

  const fallbackExisting = normalized.deduplicationKey
    ? Array.from(fallbackNotifications.values()).find(
        (notification) => notification.deduplicationKey === normalized.deduplicationKey,
      )
    : null;

  if (fallbackExisting) {
    return {
      notification: fallbackExisting,
      deliveredInProcess: 0,
      deduplicated: true,
      persisted: false,
    };
  }

  try {
    if (normalized.deduplicationKey) {
      const existing = await prisma.notification.findUnique({
        where: { deduplicationKey: normalized.deduplicationKey },
      });

      if (existing) {
        return {
          notification: existing,
          deliveredInProcess: 0,
          deduplicated: true,
          persisted: true,
        };
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId: normalized.userId,
        bookingId: normalized.bookingId,
        recipientEmail: normalized.recipientEmail,
        recipientRole: normalized.recipientRole,
        category: normalized.category,
        channel: "IN_APP",
        status: "SENT",
        priority: normalized.priority,
        title: normalized.title,
        message: normalized.message,
        actionLabel: normalized.actionLabel,
        actionUrl: normalized.actionUrl,
        metadata: normalized.metadata,
        deduplicationKey: normalized.deduplicationKey,
        sentAt: new Date(),
      },
    });

    return {
      notification,
      deliveredInProcess: notificationHub.publish(notification),
      deduplicated: false,
      persisted: true,
    };
  } catch (error) {
    if (isNotificationDatabaseUnavailableError(error)) {
      return createFallbackNotification(normalized);
    }

    if (
      normalized.deduplicationKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.notification.findUnique({
        where: { deduplicationKey: normalized.deduplicationKey },
      });

      if (existing) {
        return {
          notification: existing,
          deliveredInProcess: 0,
          deduplicated: true,
          persisted: true,
        };
      }
    }

    throw error;
  }
}

export function isNotificationDatabaseUnavailableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") ||
    (error instanceof Error && error.message.includes("Can't reach database server"))
  );
}

function createFallbackNotification(
  normalized: ReturnType<typeof normalizeInput>,
): SendRealTimeNotificationResult {
  const now = new Date();
  const notification: Notification = {
    id: `notification_${crypto.randomUUID()}`,
    userId: normalized.userId,
    bookingId: normalized.bookingId,
    recipientEmail: normalized.recipientEmail,
    recipientRole: normalized.recipientRole,
    category: normalized.category,
    channel: "IN_APP",
    status: "SENT",
    priority: normalized.priority,
    title: normalized.title,
    message: normalized.message,
    actionLabel: normalized.actionLabel,
    actionUrl: normalized.actionUrl,
    metadata: (normalized.metadata ?? null) as Prisma.JsonValue,
    deduplicationKey: normalized.deduplicationKey,
    isRead: false,
    readAt: null,
    scheduledFor: null,
    processingStartedAt: null,
    sentAt: now,
    failedAt: null,
    failureReason: null,
    createdAt: now,
    updatedAt: now,
  };

  fallbackNotifications.set(notification.id, notification);

  return {
    notification,
    deliveredInProcess: notificationHub.publish(notification),
    deduplicated: false,
    persisted: false,
  };
}

function normalizeInput(input: SendRealTimeNotificationInput) {
  const userId = normalizeOptional(input.userId);
  const bookingId = normalizeOptional(input.bookingId);
  const recipientEmail = normalizeOptional(input.recipientEmail)?.toLowerCase() ?? null;
  const recipientRole = input.recipientRole ?? null;
  const title = input.title.trim();
  const message = input.message.trim();
  const actionLabel = normalizeOptional(input.actionLabel);
  const actionUrl = normalizeOptional(input.actionUrl);
  const deduplicationKey = normalizeOptional(input.deduplicationKey);

  if (!userId && !recipientEmail && !recipientRole) {
    throw new Error(
      "Notifikasi real-time membutuhkan userId, recipientEmail, atau recipientRole.",
    );
  }
  if (!title || title.length > 180) {
    throw new Error("Judul notifikasi wajib diisi dan maksimal 180 karakter.");
  }
  if (!message) {
    throw new Error("Pesan notifikasi wajib diisi.");
  }
  if (actionLabel && actionLabel.length > 80) {
    throw new Error("Label aksi notifikasi maksimal 80 karakter.");
  }
  if (actionUrl && !isSafeActionUrl(actionUrl)) {
    throw new Error("URL aksi notifikasi harus berupa path internal atau URL HTTP(S).");
  }
  if (deduplicationKey && deduplicationKey.length > 191) {
    throw new Error("Kunci deduplikasi notifikasi maksimal 191 karakter.");
  }

  return {
    userId,
    bookingId,
    recipientEmail,
    recipientRole,
    category: input.category,
    priority: input.priority ?? "NORMAL",
    title,
    message,
    actionLabel,
    actionUrl,
    metadata: input.metadata,
    deduplicationKey,
  };
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function assertAudience(audience: NotificationAudience) {
  const hasUser = Boolean(audience.userId?.trim());
  const hasEmail = Boolean(audience.email?.trim());
  const hasRole = Boolean(audience.roles?.length);

  if (!hasUser && !hasEmail && !hasRole) {
    throw new Error("Subscription notifikasi membutuhkan user, email, atau role.");
  }
}

function matchesAudience(notification: Notification, audience: NotificationAudience) {
  if (audience.userId && notification.userId === audience.userId) return true;
  if (
    audience.email &&
    notification.recipientEmail?.toLowerCase() === audience.email.trim().toLowerCase()
  ) {
    return true;
  }
  if (
    notification.recipientRole &&
    audience.roles?.includes(notification.recipientRole)
  ) {
    return true;
  }

  return false;
}

function isSafeActionUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
