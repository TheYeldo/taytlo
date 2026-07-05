import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { LibrarySync } from "@/components/LibrarySync";
import { YandexMetrikaPageView } from "@/components/YandexMetrika";
import { siteName, siteUrl } from "@/lib/seo";
import "./globals.css";

const yandexMetrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "110426595");

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
        {yandexMetrikaId ? (
          <Script
            id="yandex-metrika"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {
                    if (document.scripts[j].src === r) { return; }
                  }
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${yandexMetrikaId}', 'ym');

                ym(${yandexMetrikaId}, 'init', {
                  ssr: true,
                  webvisor: true,
                  clickmap: true,
                  ecommerce: 'dataLayer',
                  referrer: document.referrer,
                  url: location.href,
                  accurateTrackBounce: true,
                  trackLinks: true
                });
              `
            }}
          />
        ) : null}
        <Header />
        <LibrarySync />
        {children}
        {yandexMetrikaId ? (
          <>
            <Suspense fallback={null}>
              <YandexMetrikaPageView counterId={yandexMetrikaId} />
            </Suspense>
            <noscript>
              <div>
                <img src={`https://mc.yandex.ru/watch/${yandexMetrikaId}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
              </div>
            </noscript>
          </>
        ) : null}
      </body>
    </html>
  );
}
