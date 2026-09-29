import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { updatePost, deletePost } from "@/lib/db/data";
import { revalidateBlogPages } from "@/lib/cache/revalidate-site";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: Context) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    if (typeof body?.expectedUpdatedAt !== "string") {
      return NextResponse.json({ error: "缺少文章版本，请刷新后台后重试" }, { status: 428 });
    }
    const updated = updatePost(id, body, body.expectedUpdatedAt);
    if (!updated) {
      return NextResponse.json({ error: "文章已在别处变更，当前修改仍保留在编辑器中；请先备份改动再刷新" }, { status: 409 });
    }
    revalidateBlogPages();
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    deletePost(id);
    revalidateBlogPages();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
