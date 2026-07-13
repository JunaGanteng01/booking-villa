"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const toastClassNames: NonNullable<
  NonNullable<ToasterProps["toastOptions"]>["classNames"]
> = {
  toast:
    "group !rounded-[1.35rem] !border !border-emerald-950/10 !bg-white/94 !p-4 !text-emerald-950 !shadow-[0_24px_80px_rgba(4,34,28,0.22)] !backdrop-blur-2xl dark:!border-white/10 dark:!bg-emerald-950/94 dark:!text-white",
  title: "!text-sm !font-semibold !tracking-[-0.01em]",
  description: "!mt-1 !text-xs !leading-5 !text-emerald-950/58 dark:!text-white/56",
  icon: "!mr-1 !size-5",
  actionButton:
    "!h-8 !rounded-full !bg-emerald-700 !px-3 !text-xs !font-semibold !text-white hover:!bg-emerald-600",
  cancelButton:
    "!h-8 !rounded-full !bg-emerald-950/7 !px-3 !text-xs !font-semibold !text-emerald-950 dark:!bg-white/10 dark:!text-white",
  closeButton:
    "!border-emerald-950/10 !bg-white !text-emerald-950 hover:!bg-amber-100 dark:!border-white/10 dark:!bg-emerald-900 dark:!text-white",
};

export function Toaster({ toastOptions, ...props }: ToasterProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setTheme(root.classList.contains("dark") ? "dark" : "light");
    const observer = new MutationObserver(syncTheme);

    syncTheme();
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      closeButton
      richColors
      gap={12}
      offset={20}
      mobileOffset={16}
      icons={{
        success: <CheckCircle2 className="size-5" aria-hidden />,
        info: <Info className="size-5" aria-hidden />,
        warning: <AlertTriangle className="size-5" aria-hidden />,
        error: <XCircle className="size-5" aria-hidden />,
        loading: <LoaderCircle className="size-5 animate-spin" aria-hidden />,
      }}
      toastOptions={{
        duration: 3600,
        ...toastOptions,
        classNames: {
          ...toastClassNames,
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
}
