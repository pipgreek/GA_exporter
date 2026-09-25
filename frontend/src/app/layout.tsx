import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BackgroundBlobs } from "@/components/layout/BackgroundBlobs";
import { NavigationGuardProvider } from "@/components/layout/NavigationGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "greek"],
});

export const metadata: Metadata = {
  title: "Grant Agreement Processing — ViLabs",
  description:
    "Generate the INFO document, Gantt chart and KPI monitoring files from a Grant Agreement PDF.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col overflow-x-hidden bg-slate-50 text-slate-800 selection:bg-sky-500 selection:text-white">
        <BackgroundBlobs />
        <NavigationGuardProvider>
          <SiteHeader />
          <main className="relative z-10 flex w-full flex-1 flex-col items-center px-4 sm:px-8">
            {children}
          </main>
          <SiteFooter />
        </NavigationGuardProvider>
      </body>
    </html>
  );
}
