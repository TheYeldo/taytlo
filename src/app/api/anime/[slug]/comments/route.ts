import { NextResponse } from "next/server";
import { addEpisodeComment, getEpisodeComments } from "@/lib/user-comments";

type RouteContext = {
  params: {
    slug: string;
  };
};

export async function GET(request: Request, { params }: RouteContext) {
  const episode = new URL(request.url).searchParams.get("episode");
  const comments = await getEpisodeComments({
    slug: params.slug,
    episodeNumber: episode
  });

  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: RouteContext) {
  const body = await request.json();
  const result = await addEpisodeComment({
    slug: params.slug,
    episodeNumber: body.episodeNumber,
    body: body.body
  });

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Войдите, чтобы оставить комментарий" }, { status: 401 });
  }
  if (result.status === "invalid") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  if (result.status === "not-found") {
    return NextResponse.json({ error: "Аниме не найдено" }, { status: 404 });
  }

  return NextResponse.json({ comment: result.comment }, { status: 201 });
}
