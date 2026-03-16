import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteGuestbookEntry } from "@/lib/data";

interface Context {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, context: Context) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    deleteGuestbookEntry(parseInt(id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
