import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin";
import { listAdminEpisodeComments, setEpisodeCommentHidden } from "@/lib/user-comments";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!requireAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") || 30);
  const comments = await listAdminEpisodeComments(limit);
  return NextResponse.json({ comments });
}

export async function PATCH(request: NextRequest) {
  if (!requireAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown; isHidden?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const isHidden = Boolean(body?.isHidden);

  if (!id) {
    return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
  }

  const comment = await setEpisodeCommentHidden({ id, isHidden });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json({ comment });
}
