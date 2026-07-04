"use client";

import Link from "next/link";
import BubbleMenu, { type BubbleMenuItem } from "./BubbleMenu";
import PillNav, { type PillNavItem } from "./PillNav";
import { ThemeToggle } from "./ThemeToggle";

const navItems: PillNavItem[] = [
  { href: "/#catalog", label: "Каталог" },
  { href: "/#explore", label: "Жанры" },
  { href: "/#schedule", label: "Календарь" },
  { href: "/#popular", label: "Популярное" },
  { href: "/profile", label: "Профиль" }
];

const bubbleItems: BubbleMenuItem[] = [
  {
    href: "/#catalog",
    label: "Каталог",
    ariaLabel: "Открыть каталог",
    rotation: -5,
    hoverStyles: { bgColor: "#42e8b4", textColor: "#03100d" }
  },
  {
    href: "/#explore",
    label: "Жанры",
    ariaLabel: "Открыть жанры и франшизы",
    rotation: 4,
    hoverStyles: { bgColor: "#6cb7ff", textColor: "#03111f" }
  },
  {
    href: "/#schedule",
    label: "Календарь",
    ariaLabel: "Открыть календарь серий",
    rotation: -3,
    hoverStyles: { bgColor: "#ffbf5c", textColor: "#160b00" }
  },
  {
    href: "/#popular",
    label: "Топ",
    ariaLabel: "Открыть популярное",
    rotation: 5,
    hoverStyles: { bgColor: "#ff6aa2", textColor: "#19030b" }
  },
  {
    href: "/profile",
    label: "Профиль",
    ariaLabel: "Открыть профиль",
    rotation: -4,
    hoverStyles: { bgColor: "#b89cff", textColor: "#10051f" }
  }
];

export function Header() {
  return (
    <>
      <header className="site-header">
        <PillNav
          className="desktop-header-pill-nav"
          logo={
            <span className="desktop-pill-brand">
              <span className="desktop-pill-brand-mark">TL</span>
              <strong>Taytlo</strong>
            </span>
          }
          logoAlt="Taytlo"
          items={navItems}
          actions={
            <>
              <Link className="desktop-pill-watch" href="/#catalog">
                Смотреть
              </Link>
              <ThemeToggle />
            </>
          }
          baseColor="rgba(255, 255, 255, 0.055)"
          pillColor="rgba(255, 255, 255, 0.055)"
          hoveredPillTextColor="#03100d"
          pillTextColor="var(--text)"
          initialLoadAnimation
        />
      </header>

      <BubbleMenu
        className="mobile-bubble-menu"
        logo={
          <span className="bubble-brand">
            <span className="bubble-brand-mark">TL</span>
            <strong>Taytlo</strong>
          </span>
        }
        items={bubbleItems}
        footer={
          <>
            <Link className="bubble-watch-link" href="/#catalog">
              Смотреть каталог
            </Link>
            <div className="bubble-theme-row">
              <span>Тема сайта</span>
              <ThemeToggle />
            </div>
          </>
        }
        menuAriaLabel="Открыть мобильное меню"
        menuBg="var(--panel)"
        menuContentColor="var(--text)"
        useFixedPosition
      />
    </>
  );
}
