import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark">TL</span>
        <span>Taytlo</span>
      </Link>
      <nav aria-label="Главная навигация">
        <a href="/#catalog">Каталог</a>
        <a href="/#explore">Жанры</a>
        <a href="/#schedule">Календарь</a>
        <a href="/#popular">Популярное</a>
        <a href="/profile">Профиль</a>
      </nav>
      <div className="header-actions">
        <a className="header-watch-link" href="/#catalog">Смотреть</a>
        <ThemeToggle />
      </div>
    </header>
  );
}
