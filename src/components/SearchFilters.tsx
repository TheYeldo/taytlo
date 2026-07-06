"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import type { CatalogQuery } from "@/lib/types";

type Props = {
  genres: string[];
  franchises: string[];
  query: CatalogQuery;
};

export function SearchFilters({ genres, franchises, query }: Props) {
  const router = useRouter();

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      const text = String(value).trim();
      if (!text) continue;
      params.set(key, key === "limit" ? "24" : text);
    }

    const href = `/${params.toString() ? `?${params.toString()}` : ""}` as Route;
    router.push(href, { scroll: false });
  }

  return (
    <form className="filters" action="/" method="get" onSubmit={submitFilters}>
      <label className="filters-search">
        <span>Поиск</span>
        <input name="search" defaultValue={query.search || ""} placeholder="Наруто, Фрирен, Блю Лок" />
      </label>
      <label>
        <span>Жанр</span>
        <select name="genre" defaultValue={query.genre || ""}>
          <option value="">Все жанры</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Франшиза</span>
        <select name="franchise" defaultValue={query.franchise || ""}>
          <option value="">Все франшизы</option>
          {franchises.map((franchise) => (
            <option key={franchise} value={franchise}>
              {franchise}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Доступность</span>
        <select name="availability" defaultValue={query.availability || ""}>
          <option value="">Все тайтлы</option>
          <option value="episodes">С сериями</option>
        </select>
      </label>
      <label>
        <span>Сортировка</span>
        <select name="sort" defaultValue={query.sort || "popular"}>
          <option value="popular">Популярное</option>
          <option value="rating">Рейтинг Shikimori</option>
          <option value="new">Новинки</option>
          <option value="title">По названию</option>
        </select>
      </label>
      <input type="hidden" name="limit" value={String(query.limit || 24)} />
      <button type="submit">Найти</button>
    </form>
  );
}
