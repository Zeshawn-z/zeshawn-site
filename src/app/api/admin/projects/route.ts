import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getProjects, saveProjects } from "@/lib/db/data";
import { revalidateProjectsPages } from "@/lib/cache/revalidate-site";

export async function GET() {
  const projects = getProjects();
  return NextResponse.json(projects);
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const projects = await request.json();
    saveProjects(projects);
    revalidateProjectsPages();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
