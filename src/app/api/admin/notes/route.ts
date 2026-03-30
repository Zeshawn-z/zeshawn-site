import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getAllNotesAdmin, createNote } from "@/lib/db/data";
import { revalidateNotesPages } from "@/lib/cache/revalidate-site";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  return NextResponse.json(getAllNotesAdmin());
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const note = createNote({
      slug: body.slug,
      title: body.title,
      description: body.description || "",
      content: body.content || "",
      group: body.group || "未分类",
      date: body.date || new Date().toISOString().slice(0, 10),
      tags: body.tags || [],
      order: body.order,
    });
    revalidateNotesPages();
    return NextResponse.json(note);
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
