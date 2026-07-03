"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/#catalog", label: "Каталог" },
  { href: "/#explore", label: "Жанры" },
  { href: "/#schedule", label: "Календарь" },
  { href: "/#popular", label: "Популярное" },
  { href: "/profile", label: "Профиль" }
] as const;

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/" onClick={closeMenu}>
        <span className="brand-mark">TL</span>
        <span>Taytlo</span>
      </Link>
      <nav className={isMenuOpen ? "is-open" : undefined} id="site-menu" aria-label="Главная навигация">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} onClick={closeMenu}>
            {item.label}
          </Link>
        ))}
        <div className="mobile-menu-actions">
          <Link className="mobile-watch-link" href="/#catalog" onClick={closeMenu}>
            Смотреть каталог
          </Link>
          <div className="mobile-theme-row">
            <span>Тема сайта</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <div className="header-actions">
        <Link className="header-watch-link" href="/#catalog" onClick={closeMenu}>
          Смотреть
        </Link>
        <ThemeToggle />
        <button
          className="menu-toggle"
          type="button"
          aria-controls="site-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
