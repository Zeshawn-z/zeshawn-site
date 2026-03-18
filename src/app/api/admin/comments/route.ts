import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getAllComments } from "@/lib/db/data";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || undefined;
  const comments = getAllComments({ limit: 500, offset: 0, slug });
  return NextResponse.json(comments);
}
