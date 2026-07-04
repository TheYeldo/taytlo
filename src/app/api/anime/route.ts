import { NextResponse } from "next/server";
import { getFranchises, getGenres, queryCatalog } from "@/lib/catalog";
import type { CatalogQuery } from "@/lib/types";

export const revalidate = 300;

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query: CatalogQuery = {
    search: params.get("search") || undefined,
    genre: params.get("genre") || undefined,
    franchise: params.get("franchise") || undefined,
    availability: params.get("availability") === "episodes" ? "episodes" : undefined,
    sort: (params.get("sort") as CatalogQuery["sort"]) || "popular",
    page: Number(params.get("page") || 1),
    limit: Number(params.get("limit") || 24)
  };

  return NextResponse.json({
    ...queryCatalog(query),
    facets: {
      genres: getGenres(),
      franchises: getFranchises()
    }
  });
}
