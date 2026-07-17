"use client";

import { AdminFilterBar } from "@/components/admin-filter-bar";

export function AdminUserFilter({
  query,
  role,
  status,
  roles,
  statuses,
  resultCount,
  onQueryChange,
  onRoleChange,
  onStatusChange,
  onReset,
}: {
  query: string;
  role: string;
  status: string;
  roles: string[];
  statuses: Array<{ value: string; label: string }>;
  resultCount: number;
  onQueryChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}) {
  const active = Boolean(query.trim() || role !== "ALL" || status !== "ALL");
  return (
    <AdminFilterBar
      query={query}
      onQueryChange={onQueryChange}
      placeholder="Cari nama, email, atau departemen..."
      resultCount={resultCount}
      resultLabel="pengguna ditemukan"
      hasActiveFilters={active}
      onReset={onReset}
      filters={[
        {
          label: "Peran pengguna",
          value: role,
          onChange: onRoleChange,
          options: [
            { value: "ALL", label: "Semua role" },
            ...roles.map((item) => ({ value: item, label: item })),
          ],
        },
        {
          label: "Status pengguna",
          value: status,
          onChange: onStatusChange,
          options: [{ value: "ALL", label: "Semua status" }, ...statuses],
        },
      ]}
    />
  );
}
