"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function scrollToPageTop() {
  window.requestAnimationFrame(() => window.scrollTo({ left: 0, top: 0, behavior: "auto" }));
  window.setTimeout(() => window.scrollTo({ left: 0, top: 0, behavior: "auto" }), 80);
}

export function NavigationScrollManager() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const previousPath = previousPathRef.current;

    if (pathname === "/" && previousPath?.startsWith("/anime/")) {
      scrollToPageTop();
    }

    previousPathRef.current = pathname;
  }, [pathname]);

  return null;
}
