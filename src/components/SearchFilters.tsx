import type { CatalogQuery } from "@/lib/types";

type Props = {
  genres: string[];
  franchises: string[];
  query: CatalogQuery;
};

export function SearchFilters({ genres, franchises, query }: Props) {
  return (
    <form className="filters" action="/" method="get">
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
