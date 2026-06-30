import { NextResponse } from "next/server";
import { getAniLibriaEpisodes } from "@/lib/anilibria";

export const revalidate = 600;

type RouteParams = {
  params: {
    slug: string;
  };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const result = await getAniLibriaEpisodes(params.slug);
  const status = result.state === "error" ? 502 : 200;
  return NextResponse.json(result, { status });
}
