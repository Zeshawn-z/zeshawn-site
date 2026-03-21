import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getAllPostsAdmin, createPost } from "@/lib/db/data";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  return NextResponse.json(getAllPostsAdmin());
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const post = createPost({
      slug: body.slug,
      title: body.title,
      description: body.description || "",
      content: body.content || "",
      contentType: body.contentType || "markdown",
      pdfId: body.pdfId || undefined,
      date: body.date || new Date().toISOString().slice(0, 10),
      tags: body.tags || [],
      published: body.published ?? true,
    });
    return NextResponse.json(post);
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
