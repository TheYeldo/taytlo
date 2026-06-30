"use client";

import { useMemo, useState } from "react";

type Facet = {
  name: string;
  count: number;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
}

function filterItems(items: Facet[], query: string) {
  const normalized = normalize(query);
  if (!normalized) return items;
  return items.filter((item) => normalize(item.name).includes(normalized));
}

function FacetGroup({
  title,
  placeholder,
  items,
  param,
  active,
  onSelect
}: {
  title: string;
  placeholder: string;
  items: Facet[];
  param: "genre" | "franchise";
  active: boolean;
  onSelect: () => void;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(() => filterItems(items, query), [items, query]);
  const previewLimit = param === "franchise" ? 8 : 10;
  const visibleItems = expanded ? filtered : filtered.slice(0, previewLimit);

  return (
    <div className={`facet-panel facet-panel--${param}${active ? " is-active" : ""}`} hidden={!active}>
      <button className="facet-panel-title" type="button" onClick={onSelect}>
        <span>{title}</span>
        <small>{items.length}</small>
      </button>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} />
      <div className={`facet-list${expanded ? " is-expanded" : ""}`}>
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <a href={`/?${param}=${encodeURIComponent(item.name)}#catalog`} className="facet-chip" key={item.name}>
              <span>{item.name}</span>
              <small>{item.count}</small>
            </a>
          ))
        ) : (
          <p className="empty compact-empty">Ничего не найдено</p>
        )}
      </div>
      {filtered.length > previewLimit ? (
        <button className="facet-toggle" type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Свернуть" : `Показать все ${filtered.length}`}
        </button>
      ) : null}
    </div>
  );
}

export function ExplorePanel({ genres, franchises }: { genres: Facet[]; franchises: Facet[] }) {
  const [activeTab, setActiveTab] = useState<"genre" | "franchise">("genre");

  return (
    <section className="content-section explore-section" id="explore">
      <div className="section-title">
        <span>Навигация</span>
        <h2>Жанры и франшизы</h2>
      </div>
      <div className="facet-tabs" aria-label="Переключатель навигации">
        <button className={activeTab === "genre" ? "is-active" : ""} type="button" onClick={() => setActiveTab("genre")}>
          Жанры <small>{genres.length}</small>
        </button>
        <button className={activeTab === "franchise" ? "is-active" : ""} type="button" onClick={() => setActiveTab("franchise")}>
          Франшизы <small>{franchises.length}</small>
        </button>
      </div>
      <div className="explore-grid">
        <FacetGroup
          title="Жанры"
          placeholder="Поиск жанра"
          items={genres}
          param="genre"
          active={activeTab === "genre"}
          onSelect={() => setActiveTab("genre")}
        />
        <FacetGroup
          title="Франшизы"
          placeholder="Поиск франшизы"
          items={franchises}
          param="franchise"
          active={activeTab === "franchise"}
          onSelect={() => setActiveTab("franchise")}
        />
      </div>
    </section>
  );
}
