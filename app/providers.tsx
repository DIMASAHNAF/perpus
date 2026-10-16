"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import BackgroundAttendanceScanner from "@/components/kiosk/BackgroundAttendanceScanner";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster position="top-right" />
        <BackgroundAttendanceScanner />
      </ThemeProvider>
    </SessionProvider>
  );
}

