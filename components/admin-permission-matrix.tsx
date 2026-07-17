"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const permissionActions = ["Lihat", "Tambah", "Ubah", "Hapus", "Ekspor"];

export type PermissionModule = {
  module: string;
  allowed: boolean[];
};

export function AdminPermissionMatrix({
  permissions,
  onChange,
  readOnly = false,
}: {
  permissions: PermissionModule[];
  onChange: (permissions: PermissionModule[]) => void;
  readOnly?: boolean;
}) {
  const toggle = (moduleIndex: number, permissionIndex: number) => {
    onChange(
      permissions.map((item, index) =>
        index === moduleIndex
          ? {
              ...item,
              allowed: item.allowed.map((allowed, actionIndex) =>
                actionIndex === permissionIndex ? !allowed : allowed,
              ),
            }
          : item,
      ),
    );
  };
  const toggleModule = (moduleIndex: number) => {
    const module = permissions[moduleIndex];
    const nextValue = !module.allowed.every(Boolean);
    onChange(
      permissions.map((item, index) =>
        index === moduleIndex
          ? { ...item, allowed: item.allowed.map(() => nextValue) }
          : item,
      ),
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px]">
        <thead>
          <tr className="bg-emerald-950/[0.025] text-left text-[0.6rem] font-bold uppercase tracking-[0.12em] opacity-42">
            <th className="px-5 py-3.5">Modul</th>
            {permissionActions.map((action) => (
              <th key={action} className="px-3 py-3.5 text-center">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((item, moduleIndex) => {
            const allSelected = item.allowed.every(Boolean);
            return (
              <tr
                key={item.module}
                className="border-t border-emerald-950/7 dark:border-white/7"
              >
                <td className="px-5 py-4">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      disabled={readOnly}
                      onChange={() => toggleModule(moduleIndex)}
                      className="size-4 accent-emerald-600"
                      aria-label={`Pilih seluruh izin ${item.module}`}
                    />
                    {item.module}
                  </label>
                </td>
                {item.allowed.map((allowed, permissionIndex) => (
                  <td
                    key={permissionActions[permissionIndex]}
                    className="px-3 py-4 text-center"
                  >
                    <label
                      className={cn(
                        "relative mx-auto grid size-8 place-items-center rounded-lg transition",
                        allowed
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"
                          : "bg-emerald-950/[0.035] text-transparent hover:bg-emerald-100/60 dark:bg-white/5 dark:hover:bg-white/8",
                        readOnly
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={allowed}
                        disabled={readOnly}
                        onChange={() => toggle(moduleIndex, permissionIndex)}
                        className="sr-only"
                        aria-label={`${permissionActions[permissionIndex]} modul ${item.module}`}
                      />
                      <Check className="size-4" />
                    </label>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {readOnly ? (
        <p className="border-t border-emerald-950/7 px-5 py-3 text-xs text-amber-700 dark:border-white/7 dark:text-amber-200">
          System role memiliki izin tetap dan tidak dapat diubah.
        </p>
      ) : null}
    </div>
  );
}
