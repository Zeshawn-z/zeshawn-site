import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getNoteGroupOrders, saveNoteGroupOrders } from "@/lib/db/data";
import { revalidateNotesPages } from "@/lib/cache/revalidate-site";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  return NextResponse.json(getNoteGroupOrders());
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawGroups = Array.isArray(body) ? body : body?.groups;

    if (!Array.isArray(rawGroups)) {
      return NextResponse.json({ error: "参数格式错误" }, { status: 400 });
    }

    const groups = rawGroups
      .filter((item) => item && typeof item.name === "string")
      .map((item, index) => ({
        name: String(item.name),
        order: Number.isFinite(item.order) ? Number(item.order) : index,
      }));

    saveNoteGroupOrders(groups);
    revalidateNotesPages();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
