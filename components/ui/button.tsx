"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ripple-button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-emerald-500/16 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-700 text-white shadow-[0_12px_30px_rgba(4,120,87,0.2)] hover:-translate-y-0.5 hover:bg-emerald-800",
        gold:
          "bg-amber-300 text-emerald-950 shadow-[0_12px_30px_rgba(214,168,79,0.24)] hover:-translate-y-0.5 hover:bg-amber-200",
        outline:
          "border border-emerald-950/12 bg-white/52 text-emerald-950 backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white dark:border-white/12 dark:bg-white/6 dark:text-white dark:hover:bg-white/10",
        ghost:
          "text-emerald-950/64 hover:bg-emerald-950/6 hover:text-emerald-950 dark:text-white/62 dark:hover:bg-white/8 dark:hover:text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 gap-1.5 px-3.5 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
