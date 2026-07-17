"use client";

import { useEffect, useState } from "react";
import {
  ADMIN_NOTIFICATION_EVENT,
  ADMIN_NOTIFICATION_STORAGE_PREFIX,
  adminUnreadCount,
} from "@/lib/admin-notifications";

export function useAdminNotificationCount(role: string, email: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(adminUnreadCount(role, email));
    const handleStorage = (event: StorageEvent) => {
      if (event.key?.startsWith(ADMIN_NOTIFICATION_STORAGE_PREFIX)) refresh();
    };

    refresh();
    window.addEventListener(ADMIN_NOTIFICATION_EVENT, refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(ADMIN_NOTIFICATION_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [email, role]);

  return count;
}
