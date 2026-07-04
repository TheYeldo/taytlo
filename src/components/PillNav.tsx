"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

type PillNavProps = {
  logo: ReactNode;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  actions?: ReactNode;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  initialLoadAnimation?: boolean;
};

type PillCssVars = CSSProperties & {
  "--desktop-pill-base"?: string;
  "--desktop-pill-bg"?: string;
  "--desktop-pill-hover-text"?: string;
  "--desktop-pill-text"?: string;
};

export default function PillNav({
  logo,
  logoAlt = "Taytlo",
  items,
  activeHref,
  actions,
  className = "",
  ease = "power3.out",
  baseColor = "rgba(255, 255, 255, 0.06)",
  pillColor = "rgba(255, 255, 255, 0.06)",
  hoveredPillTextColor = "#03100d",
  pillTextColor = "var(--text)",
  initialLoadAnimation = true
}: PillNavProps) {
  const pathname = usePathname();
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const timelineRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoRef = useRef<HTMLAnchorElement | null>(null);
  const logoContentRef = useRef<HTMLSpanElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);

  const cssVars: PillCssVars = {
    "--desktop-pill-base": baseColor,
    "--desktop-pill-bg": pillColor,
    "--desktop-pill-hover-text": hoveredPillTextColor,
    "--desktop-pill-text": pillTextColor
  };

  useEffect(() => {
    function layout() {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const radius = (width * width / 4 + height * height) / (2 * height);
        const diameter = Math.ceil(2 * radius) + 2;
        const delta = Math.ceil(radius - Math.sqrt(Math.max(0, radius * radius - width * width / 4))) + 1;
        const originY = diameter - delta;
        const label = pill.querySelector(".desktop-pill-label");
        const hoverLabel = pill.querySelector(".desktop-pill-label-hover");

        circle.style.width = `${diameter}px`;
        circle.style.height = `${diameter}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });
        if (label) gsap.set(label, { y: 0 });
        if (hoverLabel) gsap.set(hoverLabel, { y: height + 12, opacity: 0 });

        timelineRefs.current[index]?.kill();
        const timeline = gsap.timeline({ paused: true });
        timeline.to(circle, { scale: 1.18, xPercent: -50, duration: 1.8, ease, overwrite: "auto" }, 0);

        if (label) {
          timeline.to(label, { y: -(height + 8), duration: 1.8, ease, overwrite: "auto" }, 0);
        }

        if (hoverLabel) {
          gsap.set(hoverLabel, { y: Math.ceil(height + 80), opacity: 0 });
          timeline.to(hoverLabel, { y: 0, opacity: 1, duration: 1.8, ease, overwrite: "auto" }, 0);
        }

        timelineRefs.current[index] = timeline;
      });
    }

    layout();
    window.addEventListener("resize", layout);
    document.fonts?.ready.then(layout).catch(() => {});

    if (initialLoadAnimation) {
      if (logoRef.current) {
        gsap.fromTo(logoRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42, ease });
      }

      if (navItemsRef.current) {
        gsap.fromTo(navItemsRef.current, { width: 0, opacity: 0 }, { width: "auto", opacity: 1, duration: 0.5, ease });
      }
    }

    return () => {
      window.removeEventListener("resize", layout);
      timelineRefs.current.forEach((timeline) => timeline?.kill());
      activeTweenRefs.current.forEach((tween) => tween?.kill());
      logoTweenRef.current?.kill();
    };
  }, [ease, initialLoadAnimation, items]);

  function handleEnter(index: number) {
    const timeline = timelineRefs.current[index];
    if (!timeline) return;

    activeTweenRefs.current[index]?.kill();
    activeTweenRefs.current[index] = timeline.tweenTo(timeline.duration(), {
      duration: 0.28,
      ease,
      overwrite: "auto"
    });
  }

  function handleLeave(index: number) {
    const timeline = timelineRefs.current[index];
    if (!timeline) return;

    activeTweenRefs.current[index]?.kill();
    activeTweenRefs.current[index] = timeline.tweenTo(0, {
      duration: 0.18,
      ease,
      overwrite: "auto"
    });
  }

  function handleLogoEnter() {
    const logoContent = logoRef.current?.querySelector(".desktop-pill-brand-mark") ?? logoContentRef.current;
    if (!logoContent) return;

    logoTweenRef.current?.kill();
    gsap.set(logoContent, { rotate: 0 });
    logoTweenRef.current = gsap.to(logoContent, {
      rotate: 360,
      duration: 0.28,
      ease,
      overwrite: "auto"
    });
  }

  function isActive(href: string) {
    if (activeHref) return activeHref === href;
    if (href === pathname) return true;
    return pathname === "/" && href === "/#catalog";
  }

  return (
    <div className={`desktop-pill-nav-container ${className}`.trim()} style={cssVars}>
      <nav className="desktop-pill-nav" aria-label="Главная навигация">
        <a className="desktop-pill-logo" href="/" aria-label={logoAlt} onMouseEnter={handleLogoEnter} ref={logoRef}>
          <span className="desktop-pill-logo-content" ref={logoContentRef}>
            {logo}
          </span>
        </a>

        <div className="desktop-pill-nav-items" ref={navItemsRef}>
          <ul className="desktop-pill-list">
            {items.map((item, index) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`desktop-pill${isActive(item.href) ? " is-active" : ""}`}
                  aria-label={item.ariaLabel || item.label}
                  onMouseEnter={() => handleEnter(index)}
                  onMouseLeave={() => handleLeave(index)}
                  onFocus={() => handleEnter(index)}
                  onBlur={() => handleLeave(index)}
                >
                  <span
                    className="desktop-pill-hover-circle"
                    aria-hidden="true"
                    ref={(element) => {
                      circleRefs.current[index] = element;
                    }}
                  />
                  <span className="desktop-pill-label-stack">
                    <span className="desktop-pill-label">{item.label}</span>
                    <span className="desktop-pill-label-hover" aria-hidden="true">
                      {item.label}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {actions ? <div className="desktop-pill-actions">{actions}</div> : null}
      </nav>
    </div>
  );
}
