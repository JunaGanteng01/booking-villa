"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminFilterDefinition = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

export function AdminFilterBar({
  query,
  onQueryChange,
  placeholder,
  filters = [],
  resultCount,
  resultLabel = "data ditemukan",
  onReset,
  hasActiveFilters,
  className,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  filters?: AdminFilterDefinition[];
  resultCount?: number;
  resultLabel?: string;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-950/35 dark:text-white/35" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500/35 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/6"
          />
        </div>
        {filters.length ? (
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <label key={filter.label} className="relative">
                <span className="sr-only">{filter.label}</span>
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  className="h-11 appearance-none rounded-xl border border-emerald-950/10 bg-white/72 pl-3 pr-9 text-xs font-semibold outline-none transition focus:border-emerald-500/35 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#12231f]"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 opacity-40" />
              </label>
            ))}
          </div>
        ) : null}
      </div>
      {resultCount !== undefined ? (
        <div className="mt-4 flex items-center justify-between border-t border-emerald-950/7 pt-4 text-xs text-emerald-950/40 dark:border-white/7 dark:text-white/38">
          <p>
            <strong className="text-emerald-700 dark:text-emerald-300">
              {resultCount}
            </strong>{" "}
            {resultLabel}
          </p>
          {hasActiveFilters && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300"
            >
              <X className="size-3.5" /> Reset filter
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
