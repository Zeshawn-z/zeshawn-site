import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getProjects, saveProjects } from "@/lib/db/data";
import { revalidateProjectsPages } from "@/lib/cache/revalidate-site";
import { dataRevision, requireCurrentRevision, validStringList, validUniqueIds, versionedJson } from "@/lib/admin/versioned-save";
import type { Project } from "@/lib/db/types";

export async function GET() {
  const projects = getProjects();
  return versionedJson(projects);
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const projects: unknown = await request.json();
    if (!validUniqueIds(projects) || !projects.every((item) =>
      typeof item.title === "string" && typeof item.description === "string" && validStringList(item.tags)
    )) {
      return NextResponse.json({ error: "项目数据格式错误" }, { status: 400 });
    }
    const conflict = requireCurrentRevision(request, getProjects());
    if (conflict) return conflict;
    saveProjects(projects as unknown as Project[]);
    revalidateProjectsPages();
    return NextResponse.json({ success: true }, { headers: { "X-Data-Revision": dataRevision(getProjects()) } });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
