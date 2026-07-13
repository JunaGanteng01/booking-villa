"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export type AppNotification = {
  title: string;
  description?: string;
  variant?: "success" | "info" | "warning" | "error";
  duration?: number;
};

type NotificationContextValue = {
  notify: (notification: AppNotification) => string | number;
};

const APP_NOTIFICATION_EVENT = "villaku:notification";
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function publishAppNotification(notification: AppNotification) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppNotification>(APP_NOTIFICATION_EVENT, { detail: notification }));
}

export function NotificationRoot({ children }: { children: ReactNode }) {
  const [announcement, setAnnouncement] = useState("");

  const notify = useCallback((notification: AppNotification) => {
    const { title, description, duration, variant = "info" } = notification;
    const options = { description, duration };
    const id = toast[variant](title, options);

    setAnnouncement(description ? `${title}. ${description}` : title);
    return id;
  }, []);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const notification = (event as CustomEvent<AppNotification>).detail;
      if (notification?.title) notify(notification);
    };
    const handleOffline = () =>
      notify({
        title: "Koneksi terputus",
        description: "Perubahan akan dilanjutkan setelah perangkat kembali online.",
        variant: "warning",
        duration: 5000,
      });
    const handleOnline = () =>
      notify({
        title: "Koneksi kembali aktif",
        description: "Villaku siap digunakan kembali.",
        variant: "success",
      });

    window.addEventListener(APP_NOTIFICATION_EVENT, handleNotification);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener(APP_NOTIFICATION_EVENT, handleNotification);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [notify]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster />
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </NotificationContext.Provider>
  );
}

export function useAppNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useAppNotifications must be used inside NotificationRoot");
  }
  return context;
}
