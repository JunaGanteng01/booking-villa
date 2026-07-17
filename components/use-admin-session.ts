"use client";

import { useAuthSession } from "@/components/use-auth-session";
import { getRoleDestination, getRoleLabel } from "@/lib/demo-auth";
import { hasPermission, requiredPermission } from "@/lib/rbac";

export type AdminSessionProfile = {
  id?: string;
  name: string;
  email: string;
  role: string;
};

const emptyProfile: AdminSessionProfile = {
  name: "Staf VillaKu",
  email: "",
  role: "",
};

export function useAdminSession() {
  const session = useAuthSession();
  const profile: AdminSessionProfile = session.profile ?? emptyProfile;

  const roleLabel = profile.role ? getRoleLabel(profile.role) : "Memuat akses";
  const canAccess = (pathname: string, method = "GET") => {
    const permission = requiredPermission(pathname, method);
    return permission ? hasPermission(profile.role, permission) : false;
  };
  return {
    profile,
    roleLabel,
    initials: session.initials,
    canAccess,
    home: getRoleDestination(profile.role),
    logout: session.logout,
  };
}
