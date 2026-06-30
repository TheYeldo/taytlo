import { NextResponse } from "next/server";
import { getAnimeBySlug, getRelatedAnime } from "@/lib/catalog";

export const revalidate = 300;

type RouteParams = {
  params: {
    slug: string;
  };
};

export function GET(_request: Request, { params }: RouteParams) {
  const anime = getAnimeBySlug(params.slug);
  if (!anime) {
    return NextResponse.json({ error: "Anime not found" }, { status: 404 });
  }

  return NextResponse.json({
    anime,
    related: getRelatedAnime(anime)
  });
}
