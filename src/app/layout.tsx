import type { Metadata } from "next";
import "./globals.css";

import ScheduleAlarm from "@/components/ScheduleAlarm";

export const metadata: Metadata = {
  title: "QR Treasure Hunt",
  description: "Scan QR codes to collect treasures!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ScheduleAlarm />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
