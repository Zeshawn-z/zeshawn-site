import { NextRequest, NextResponse } from "next/server";
import { getCommentsBySlug, addComment } from "@/lib/db/data";

// GET /api/comments?slug=xxx&page=1&order=asc
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "缺少 slug 参数" }, { status: 400 });
  }
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const order = (searchParams.get("order") === "desc" ? "desc" : "asc") as "asc" | "desc";

  const result = getCommentsBySlug(slug, { page, limit: 10, order });
  return NextResponse.json(result);
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = (body.slug || "").trim();
    const nickname = (body.nickname || "").trim();
    const content = (body.content || "").trim();
    const parentId = body.parentId ? parseInt(body.parentId) : undefined;

    if (!slug) {
      return NextResponse.json({ error: "缺少文章标识" }, { status: 400 });
    }
    if (!nickname || nickname.length > 30) {
      return NextResponse.json({ error: "昵称不能为空且不超过30字" }, { status: 400 });
    }
    if (!content || content.length > 1000) {
      return NextResponse.json({ error: "评论不能为空且不超过1000字" }, { status: 400 });
    }

    const comment = addComment(slug, nickname, content, parentId);
    return NextResponse.json(comment);
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
