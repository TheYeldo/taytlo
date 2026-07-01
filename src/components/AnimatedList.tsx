"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ItemClassName<T> = string | ((item: T, index: number, isSelected: boolean) => string);

type AnimatedListProps<T> = {
  items: T[];
  renderItem?: (item: T, index: number, isSelected: boolean) => ReactNode;
  getKey?: (item: T, index: number) => string | number;
  onItemSelect?: (item: T, index: number) => void;
  selectedIndex?: number;
  initialSelectedIndex?: number;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: ItemClassName<T>;
  displayScrollbar?: boolean;
  ariaLabel?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveClassName<T>(itemClassName: ItemClassName<T> | undefined, item: T, index: number, isSelected: boolean) {
  if (!itemClassName) return "";
  return typeof itemClassName === "function" ? itemClassName(item, index, isSelected) : itemClassName;
}

export default function AnimatedList<T>({
  items,
  renderItem,
  getKey,
  onItemSelect,
  selectedIndex,
  initialSelectedIndex = -1,
  showGradients = true,
  enableArrowNavigation = true,
  className = "",
  itemClassName = "",
  displayScrollbar = true,
  ariaLabel = "Animated list"
}: AnimatedListProps<T>) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(initialSelectedIndex);
  const [visibleIndexes, setVisibleIndexes] = useState<Set<number>>(new Set());
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(0);
  const activeIndex = typeof selectedIndex === "number" ? selectedIndex : focusedIndex;

  useEffect(() => {
    if (typeof selectedIndex === "number" && selectedIndex >= 0) {
      setFocusedIndex(selectedIndex);
    }
  }, [selectedIndex]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateGradients = () => {
      const { scrollTop, scrollHeight, clientHeight } = list;
      const bottomDistance = scrollHeight - (scrollTop + clientHeight);
      setTopGradientOpacity(Math.min(scrollTop / 48, 1));
      setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 48, 1));
    };

    updateGradients();
    const frame = window.requestAnimationFrame(updateGradients);
    return () => window.cancelAnimationFrame(frame);
  }, [items.length]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
    setVisibleIndexes(new Set());

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      setVisibleIndexes(new Set(items.map((_, index) => index)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setVisibleIndexes((current) => {
            if (current.has(index)) return current;
            const next = new Set(current);
            next.add(index);
            return next;
          });
          observer.unobserve(entry.target);
        }
      },
      { root: listRef.current, threshold: 0.34 }
    );

    for (const item of itemRefs.current) {
      if (item) observer.observe(item);
    }

    return () => observer.disconnect();
  }, [items]);

  function updateScrollFade() {
    const list = listRef.current;
    if (!list) return;
    const { scrollTop, scrollHeight, clientHeight } = list;
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setTopGradientOpacity(Math.min(scrollTop / 48, 1));
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 48, 1));
  }

  function selectItem(item: T, index: number) {
    setFocusedIndex(index);
    onItemSelect?.(item, index);
  }

  function focusItem(index: number) {
    const next = clamp(index, 0, Math.max(0, items.length - 1));
    setFocusedIndex(next);
    itemRefs.current[next]?.focus({ preventScroll: true });
    itemRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!enableArrowNavigation || !items.length) return;

    const current = focusedIndex >= 0 ? focusedIndex : activeIndex >= 0 ? activeIndex : 0;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(current + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(items.length - 1);
    } else if ((event.key === "Enter" || event.key === " ") && current >= 0) {
      event.preventDefault();
      selectItem(items[current], current);
    }
  }

  return (
    <div className={`animated-list-shell ${className}`.trim()}>
      <div
        ref={listRef}
        className={`animated-list-scroll ${displayScrollbar ? "" : "no-scrollbar"}`.trim()}
        onKeyDown={handleKeyDown}
        onScroll={updateScrollFade}
        aria-label={ariaLabel}
      >
        {items.map((item, index) => {
          const isSelected = index === activeIndex;
          const key = getKey ? getKey(item, index) : index;
          return (
            <button
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className={`animated-list-item ${visibleIndexes.has(index) ? "is-visible" : ""} ${isSelected ? "is-selected" : ""} ${resolveClassName(
                itemClassName,
                item,
                index,
                isSelected
              )}`.trim()}
              data-index={index}
              key={key}
              type="button"
              aria-pressed={isSelected}
              style={{ "--animated-index": index } as CSSProperties}
              onClick={() => selectItem(item, index)}
              onFocus={() => setFocusedIndex(index)}
            >
              {renderItem ? renderItem(item, index, isSelected) : String(item)}
            </button>
          );
        })}
      </div>
      {showGradients ? (
        <>
          <span className="animated-list-gradient animated-list-gradient-top" style={{ opacity: topGradientOpacity }} />
          <span className="animated-list-gradient animated-list-gradient-bottom" style={{ opacity: bottomGradientOpacity }} />
        </>
      ) : null}
    </div>
  );
}
