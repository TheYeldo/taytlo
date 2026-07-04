"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export type BubbleMenuItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  rotation?: number;
  hoverStyles?: {
    bgColor?: string;
    textColor?: string;
  };
};

type BubbleMenuProps = {
  logo: ReactNode;
  items: BubbleMenuItem[];
  footer?: ReactNode;
  onMenuClick?: (open: boolean) => void;
  className?: string;
  style?: CSSProperties;
  menuAriaLabel?: string;
  menuBg?: string;
  menuContentColor?: string;
  useFixedPosition?: boolean;
  animationEase?: string;
  animationDuration?: number;
  staggerDelay?: number;
};

export default function BubbleMenu({
  logo,
  items,
  footer,
  onMenuClick,
  className,
  style,
  menuAriaLabel = "Открыть меню",
  menuBg = "var(--panel)",
  menuContentColor = "var(--text)",
  useFixedPosition = false,
  animationEase = "back.out(1.5)",
  animationDuration = 0.5,
  staggerDelay = 0.1
}: BubbleMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const bubblesRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const containerClassName = ["bubble-menu", useFixedPosition ? "fixed" : "absolute", className].filter(Boolean).join(" ");
  const overlayClassName = ["bubble-menu-items", useFixedPosition ? "fixed" : "absolute"].filter(Boolean).join(" ");

  function setOpen(nextState: boolean) {
    if (nextState) setShowOverlay(true);
    setIsMenuOpen(nextState);
    onMenuClick?.(nextState);
  }

  function handleToggle() {
    setOpen(!isMenuOpen);
  }

  function handleItemClick() {
    setOpen(false);
  }

  useEffect(() => {
    const overlay = overlayRef.current;
    const bubbles = bubblesRef.current.filter(Boolean);
    const labels = labelRefs.current.filter(Boolean);
    if (!overlay || !bubbles.length) return;

    if (isMenuOpen) {
      gsap.set(overlay, { display: "flex" });
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.set(bubbles, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(labels, { y: 22, autoAlpha: 0 });

      bubbles.forEach((bubble, index) => {
        const delay = index * staggerDelay + gsap.utils.random(-0.04, 0.04);
        const timeline = gsap.timeline({ delay });
        timeline.to(bubble, {
          scale: 1,
          duration: animationDuration,
          ease: animationEase
        });
        if (labels[index]) {
          timeline.to(
            labels[index],
            {
              y: 0,
              autoAlpha: 1,
              duration: animationDuration,
              ease: "power3.out"
            },
            `-=${animationDuration * 0.9}`
          );
        }
      });
    } else if (showOverlay) {
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.to(labels, {
        y: 22,
        autoAlpha: 0,
        duration: 0.18,
        ease: "power3.in"
      });
      gsap.to(bubbles, {
        scale: 0,
        duration: 0.18,
        ease: "power3.in",
        onComplete: () => {
          gsap.set(overlay, { display: "none" });
          setShowOverlay(false);
        }
      });
    }
  }, [animationDuration, animationEase, isMenuOpen, showOverlay, staggerDelay]);

  useEffect(() => {
    function handleResize() {
      if (!isMenuOpen) return;
      const bubbles = bubblesRef.current.filter(Boolean);
      const isDesktop = window.innerWidth >= 900;
      bubbles.forEach((bubble, index) => {
        const item = items[index];
        if (bubble && item) {
          gsap.set(bubble, { rotation: isDesktop ? item.rotation ?? 0 : 0 });
        }
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen, items]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      <nav className={containerClassName} style={style} aria-label="Мобильная навигация">
        <a className="bubble logo-bubble" aria-label="Taytlo" style={{ background: menuBg }} href="/" onClick={handleItemClick}>
          <span className="logo-content">{logo}</span>
        </a>
        <button
          type="button"
          className={`bubble toggle-bubble menu-btn${isMenuOpen ? " open" : ""}`}
          onClick={handleToggle}
          aria-label={menuAriaLabel}
          aria-expanded={isMenuOpen}
          style={{ background: menuBg }}
        >
          <span className="menu-line" style={{ background: menuContentColor }} />
          <span className="menu-line short" style={{ background: menuContentColor }} />
        </button>
      </nav>

      {showOverlay ? (
        <div ref={overlayRef} className={overlayClassName} aria-hidden={!isMenuOpen}>
          <ul className="pill-list" role="menu" aria-label="Ссылки меню">
            {items.map((item, index) => (
              <li key={item.href} role="none" className="pill-col">
                <a
                  role="menuitem"
                  href={item.href}
                  aria-label={item.ariaLabel || item.label}
                  className="pill-link"
                  onClick={handleItemClick}
                  style={
                    {
                      "--item-rot": `${item.rotation ?? 0}deg`,
                      "--pill-bg": menuBg,
                      "--pill-color": menuContentColor,
                      "--hover-bg": item.hoverStyles?.bgColor || "rgba(66, 232, 180, 0.18)",
                      "--hover-color": item.hoverStyles?.textColor || menuContentColor
                    } as CSSProperties
                  }
                  ref={(element) => {
                    bubblesRef.current[index] = element;
                  }}
                >
                  <span
                    className="pill-label"
                    ref={(element) => {
                      labelRefs.current[index] = element;
                    }}
                  >
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {footer ? <div className="bubble-menu-footer">{footer}</div> : null}
        </div>
      ) : null}
    </>
  );
}
