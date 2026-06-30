"use client";

import type { CSSProperties, ElementType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type SplitType = "chars" | "words" | "lines" | "words, chars";

type MotionPoint = {
  opacity?: number;
  y?: number;
};

type SplitTextProps = {
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: SplitType;
  from?: MotionPoint;
  to?: MotionPoint;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
};

type TextPiece =
  | { kind: "space"; text: string }
  | { kind: "unit"; text: string; index: number }
  | { kind: "word"; chars: string[]; indexStart: number };

function toCssLength(value: number | undefined, fallback: number) {
  return `${typeof value === "number" ? value : fallback}px`;
}

function splitText(text: string, splitType: SplitType) {
  const pieces: TextPiece[] = [];
  let unitIndex = 0;
  const byChars = splitType.includes("chars");

  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;

    if (/^\s+$/.test(part)) {
      pieces.push({ kind: "space", text: part });
      continue;
    }

    if (byChars) {
      const chars = Array.from(part);
      pieces.push({ kind: "word", chars, indexStart: unitIndex });
      unitIndex += chars.length;
      continue;
    }

    pieces.push({ kind: "unit", text: part, index: unitIndex });
    unitIndex += 1;
  }

  return { pieces, unitCount: unitIndex };
}

export default function SplitText({
  tag = "p",
  text,
  className = "",
  delay = 45,
  duration = 0.82,
  ease = "cubic-bezier(0.2, 0.82, 0.22, 1)",
  splitType = "chars",
  from = { opacity: 0, y: 36 },
  to = { opacity: 1, y: 0 },
  threshold = 0.12,
  rootMargin = "0px 0px -12% 0px",
  textAlign = "inherit",
  onLetterAnimationComplete
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const completedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { pieces, unitCount } = useMemo(() => splitText(text, splitType), [text, splitType]);
  const Component = tag as ElementType;

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    completedRef.current = false;
    setIsVisible(false);
  }, [text, splitType]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !text) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, text, threshold]);

  useEffect(() => {
    if (!isVisible || completedRef.current || unitCount === 0) return;

    const totalMs = Math.max(0, (unitCount - 1) * delay + duration * 1000);
    const timeout = window.setTimeout(() => {
      completedRef.current = true;
      onLetterAnimationComplete?.();
    }, totalMs);

    return () => window.clearTimeout(timeout);
  }, [delay, duration, isVisible, onLetterAnimationComplete, unitCount]);

  const style = {
    "--split-delay": `${delay}ms`,
    "--split-duration": `${duration}s`,
    "--split-ease": ease,
    "--split-from-opacity": String(from.opacity ?? 0),
    "--split-to-opacity": String(to.opacity ?? 1),
    "--split-from-y": toCssLength(from.y, 36),
    "--split-to-y": toCssLength(to.y, 0),
    textAlign
  } as CSSProperties;

  return (
    <Component ref={ref} className={`split-parent ${isReady ? "is-ready" : ""} ${isVisible ? "is-visible" : ""} ${className}`.trim()} style={style} aria-label={text}>
      <span className="split-reader">{text}</span>
      <span aria-hidden="true" className="split-visual">
        {pieces.map((piece, pieceIndex) => {
          if (piece.kind === "space") return <span key={`space-${pieceIndex}`}>{piece.text}</span>;

          if (piece.kind === "word") {
            return (
              <span className="split-word" key={`word-${pieceIndex}`}>
                {piece.chars.map((char, charIndex) => (
                  <span className="split-unit" key={`${char}-${charIndex}`} style={{ "--split-index": piece.indexStart + charIndex } as CSSProperties}>
                    {char}
                  </span>
                ))}
              </span>
            );
          }

          return (
            <span className="split-unit" key={`${piece.text}-${piece.index}`} style={{ "--split-index": piece.index } as CSSProperties}>
              {piece.text}
            </span>
          );
        })}
      </span>
    </Component>
  );
}
