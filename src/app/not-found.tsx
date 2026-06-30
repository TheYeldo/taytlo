import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Страница не найдена</h1>
      <p>Такого тайтла пока нет в каталоге Taytlo.</p>
      <Link href="/">Вернуться в каталог</Link>
    </main>
  );
}
