"use client";

import type { ImgHTMLAttributes, SyntheticEvent } from "react";
import { useEffect, useState } from "react";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = "/assets/fallback-poster.svg";

export function SafeImage({ src, fallbackSrc = DEFAULT_FALLBACK, alt, onError, decoding = "async", referrerPolicy = "no-referrer", ...props }: SafeImageProps) {
  const initialSrc = src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [fallbackSrc, src]);

  function handleError(event: SyntheticEvent<HTMLImageElement, Event>) {
    onError?.(event);
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  }

  return <img {...props} src={currentSrc} alt={alt || ""} decoding={decoding} referrerPolicy={referrerPolicy} onError={handleError} />;
}
