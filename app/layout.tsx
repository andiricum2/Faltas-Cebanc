import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AutoUpdate from "@/components/AutoUpdate"
import AppShell from "@/components/layout/AppShell";
import { SnapshotProvider } from "@/lib/services/snapshotContext";
import { ConfigProvider } from "@/lib/services/configContext";
import { Toaster } from "sonner";
import GlobalErrorToasts from "@/components/ui/GlobalErrorToasts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Faltas",
  description: "Cliente Faltas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AutoUpdate />
        <Toaster richColors position="top-right" />
        <GlobalErrorToasts />
        <ConfigProvider>
          <SnapshotProvider>
            <AppShell>
              {children}
            </AppShell>
          </SnapshotProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
