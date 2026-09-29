import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getExperiences, saveExperiences } from "@/lib/db/data";
import { revalidateAboutPages } from "@/lib/cache/revalidate-site";
import { dataRevision, requireCurrentRevision, validStringList, validUniqueIds, versionedJson } from "@/lib/admin/versioned-save";
import type { Experience } from "@/lib/db/types";

export async function GET() {
  const experiences = getExperiences();
  return versionedJson(experiences);
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const experiences: unknown = await request.json();
    if (!validUniqueIds(experiences) || !experiences.every((item) =>
      typeof item.title === "string" && typeof item.company === "string" &&
      typeof item.period === "string" && typeof item.description === "string" && validStringList(item.tags)
    )) {
      return NextResponse.json({ error: "经历数据格式错误" }, { status: 400 });
    }
    const conflict = requireCurrentRevision(request, getExperiences());
    if (conflict) return conflict;
    saveExperiences(experiences as unknown as Experience[]);
    revalidateAboutPages();
    return NextResponse.json({ success: true }, { headers: { "X-Data-Revision": dataRevision(getExperiences()) } });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
