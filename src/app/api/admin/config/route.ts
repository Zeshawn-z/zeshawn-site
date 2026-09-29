import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getSiteConfig, updateSiteConfig } from "@/lib/db/data";
import { revalidateEntireSite } from "@/lib/cache/revalidate-site";
import { dataRevision, requireCurrentRevision, versionedJson } from "@/lib/admin/versioned-save";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  return versionedJson(getSiteConfig());
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      !Object.values(body).every((value) => typeof value === "string")) {
      return NextResponse.json({ error: "设置数据格式错误" }, { status: 400 });
    }
    const conflict = requireCurrentRevision(request, getSiteConfig());
    if (conflict) return conflict;
    updateSiteConfig(body as Record<string, string>);
    revalidateEntireSite();
    return NextResponse.json({ success: true }, { headers: { "X-Data-Revision": dataRevision(getSiteConfig()) } });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
