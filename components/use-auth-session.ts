"use client";

import { useEffect, useMemo, useState } from "react";
import { getRoleDestination } from "@/lib/demo-auth";

export type AuthSessionProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function useAuthSession() {
  const [profile, setProfile] = useState<AuthSessionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/auth/session", {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { user?: AuthSessionProfile };
      })
      .then((payload) => {
        const user = payload?.user;
        if (!user) {
          setProfile(null);
          window.localStorage.removeItem("villaku-session-preview");
          return;
        }

        const normalizedProfile = {
          ...user,
          name: user.name?.trim() || user.email.split("@")[0],
        };
        setProfile(normalizedProfile);
        window.localStorage.setItem(
          "villaku-session-preview",
          JSON.stringify({
            ...normalizedProfile,
            signedInAt: new Date().toISOString(),
          }),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setProfile(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const initials = useMemo(() => getInitials(profile?.name), [profile?.name]);
  const firstName = profile?.name.trim().split(/\s+/)[0] || "Tamu";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.localStorage.removeItem("villaku-session-preview");
    window.location.assign("/login");
  };

  return {
    profile,
    isLoading,
    initials,
    firstName,
    home: getRoleDestination(profile?.role ?? ""),
    logout,
  };
}

export function getInitials(name?: string | null) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VK"
  );
}
