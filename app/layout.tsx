import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NotificationRoot } from "@/components/notification-root";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VillaKu — Private Resorts",
    template: "%s | VillaKu",
  },
  description:
    "Temukan dan pesan villa premium di Bali dengan pengalaman booking yang cepat, aman, dan personal.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <NotificationRoot>{children}</NotificationRoot>
      </body>
    </html>
  );
}
