"use client";

import { Star } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { cn } from "@/lib/utils";

type RatingSize = "sm" | "md" | "lg";

type RatingStarsProps = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: RatingSize;
  label?: string;
  disabled?: boolean;
  showValue?: boolean;
  className?: string;
  filledClassName?: string;
  emptyClassName?: string;
};

const sizeClasses: Record<RatingSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-9 sm:size-10",
};

export function RatingStars({
  value,
  onChange,
  max = 5,
  size = "md",
  label = "Rating",
  disabled = false,
  showValue = false,
  className,
  filledClassName,
  emptyClassName,
}: RatingStarsProps) {
  const [previewValue, setPreviewValue] = useState<number | null>(null);
  const totalStars = Math.max(1, Math.floor(max));
  const safeValue = clamp(Number.isFinite(value) ? value : 0, 0, totalStars);
  const displayValue = previewValue ?? safeValue;
  const interactive = typeof onChange === "function";

  if (!interactive) {
    return (
      <div
        className={cn("inline-flex items-center gap-2", className)}
        role="img"
        aria-label={`${label}: ${formatRating(safeValue)} dari ${totalStars} bintang`}
      >
        <span className="inline-flex items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: totalStars }, (_, index) => {
            const fill = clamp(safeValue - index, 0, 1) * 100;

            return (
              <span key={index} className={cn("relative inline-block shrink-0", sizeClasses[size])}>
                <Star
                  className={cn(
                    "absolute inset-0 size-full fill-transparent text-emerald-950/14 dark:text-white/16",
                    emptyClassName,
                  )}
                  strokeWidth={1.8}
                />
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}>
                  <Star
                    className={cn(
                      "max-w-none shrink-0 fill-current text-amber-400",
                      sizeClasses[size],
                      filledClassName,
                    )}
                    strokeWidth={1.8}
                  />
                </span>
              </span>
            );
          })}
        </span>
        {showValue ? (
          <span className="text-sm font-semibold tabular-nums">{formatRating(safeValue)}</span>
        ) : null}
      </div>
    );
  }

  const selectRating = (nextValue: number) => {
    if (!disabled) onChange(clamp(nextValue, 1, totalStars));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, rating: number) => {
    if (disabled) return;

    let nextValue: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextValue = Math.min(totalStars, rating + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextValue = Math.max(1, rating - 1);
    } else if (event.key === "Home") {
      nextValue = 1;
    } else if (event.key === "End") {
      nextValue = totalStars;
    }

    if (nextValue === null) return;

    event.preventDefault();
    selectRating(nextValue);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-rating="${nextValue}"]`)
      ?.focus();
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onMouseLeave={() => setPreviewValue(null)}
    >
      {Array.from({ length: totalStars }, (_, index) => {
        const rating = index + 1;
        const selected = rating <= displayValue;
        const isTabStop = safeValue === rating || (safeValue === 0 && rating === 1);

        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={safeValue === rating}
            aria-label={`${rating} dari ${totalStars} bintang`}
            data-rating={rating}
            disabled={disabled}
            tabIndex={isTabStop ? 0 : -1}
            onClick={() => selectRating(rating)}
            onKeyDown={(event) => handleKeyDown(event, rating)}
            onMouseEnter={() => setPreviewValue(rating)}
            onFocus={() => setPreviewValue(rating)}
            onBlur={() => setPreviewValue(null)}
            className="rounded-full p-1 text-amber-400 outline-none transition-[transform,color] duration-200 hover:scale-110 focus-visible:scale-110 focus-visible:ring-4 focus-visible:ring-amber-400/18 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
          >
            <Star
              className={cn(
                sizeClasses[size],
                selected
                  ? "fill-current"
                  : "fill-transparent text-emerald-950/16 dark:text-white/16",
                selected ? filledClassName : emptyClassName,
              )}
              strokeWidth={1.8}
            />
          </button>
        );
      })}
      {showValue ? (
        <span className="ml-1 min-w-8 text-sm font-semibold tabular-nums" aria-live="polite">
          {formatRating(displayValue)}
        </span>
      ) : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatRating(value: number) {
  return String(Number(value.toFixed(2)));
}
