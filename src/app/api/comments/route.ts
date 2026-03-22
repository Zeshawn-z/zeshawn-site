import { NextRequest, NextResponse } from "next/server";
import { getCommentsBySlug, addComment, getPostBySlug, getSiteConfig } from "@/lib/db/data";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getIpLocation } from "@/lib/ip-location";

// GET /api/comments?slug=xxx&page=1&order=asc
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "缺少 slug 参数" }, { status: 400 });
  }
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const order = (searchParams.get("order") === "desc" ? "desc" : "asc") as "asc" | "desc";

  // 返回评论数据时附带评论开关状态
  const config = getSiteConfig();
  const globalEnabled = config["comments.enabled"] !== "false";
  const post = getPostBySlug(slug);
  const postEnabled = post?.commentsEnabled !== false;
  const commentsEnabled = globalEnabled && postEnabled;

  const result = getCommentsBySlug(slug, { page, limit: 10, order });
  return NextResponse.json({ ...result, commentsEnabled });
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    // 检查全局评论开关
    const config = getSiteConfig();
    if (config["comments.enabled"] === "false") {
      return NextResponse.json({ error: "评论功能已关闭" }, { status: 403 });
    }

    const body = await request.json();
    const slug = (body.slug || "").trim();

    if (!slug) {
      return NextResponse.json({ error: "缺少文章标识" }, { status: 400 });
    }

    // 检查帖子级评论开关
    const post = getPostBySlug(slug);
    if (post && post.commentsEnabled === false) {
      return NextResponse.json({ error: "该文章的评论功能已关闭" }, { status: 403 });
    }

    // 速率限制：每 IP 每分钟最多 10 次评论
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = checkRateLimit(`comments:${ip}`, 10, 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: `操作太频繁，请 ${Math.ceil(retryAfterMs / 1000)} 秒后再试` },
        { status: 429 }
      );
    }

    const nickname = (body.nickname || "").trim();
    const content = (body.content || "").trim();
    const parentId = body.parentId ? parseInt(body.parentId) : undefined;

    if (!nickname || nickname.length > 30) {
      return NextResponse.json({ error: "昵称不能为空且不超过30字" }, { status: 400 });
    }
    if (!content || content.length > 1000) {
      return NextResponse.json({ error: "评论不能为空且不超过1000字" }, { status: 400 });
    }

    // 异步查询 IP 归属地
    const location = await getIpLocation(ip);

    const comment = addComment(slug, nickname, content, parentId, location);
    return NextResponse.json(comment);
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
