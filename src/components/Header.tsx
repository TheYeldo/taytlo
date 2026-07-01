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
        <Link href="/#catalog">Каталог</Link>
        <Link href="/#explore">Жанры</Link>
        <Link href="/#schedule">Календарь</Link>
        <Link href="/#popular">Популярное</Link>
        <Link href="/profile">Профиль</Link>
      </nav>
      <div className="header-actions">
        <Link className="header-watch-link" href="/#catalog">Смотреть</Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
