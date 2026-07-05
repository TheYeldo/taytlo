import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { LibrarySync } from "@/components/LibrarySync";
import { YandexMetrika } from "@/components/YandexMetrika";
import { siteName, siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${siteName} - каталог аниме, рейтинги и просмотр`,
    template: `%s | ${siteName}`
  },
  description: "Русский каталог аниме с поиском, рейтингами Shikimori, франшизами, календарем серий и удобными страницами тайтлов.",
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    siteName,
    locale: "ru_RU",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b10"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Header />
        <LibrarySync />
        {children}
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
      </body>
    </html>
  );
}
