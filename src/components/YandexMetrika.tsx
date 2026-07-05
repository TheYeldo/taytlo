"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

export function YandexMetrikaPageView({ counterId }: { counterId: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstHit = useRef(true);

  useEffect(() => {
    if (!counterId || typeof window.ym !== "function") return;
    if (isFirstHit.current) {
      isFirstHit.current = false;
      return;
    }

    const query = searchParams.toString();
    window.ym(counterId, "hit", `${pathname}${query ? `?${query}` : ""}`);
  }, [pathname, searchParams]);

  return null;
}
