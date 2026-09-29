import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getSkills, saveSkills } from "@/lib/db/data";
import { revalidateAboutPages } from "@/lib/cache/revalidate-site";
import { dataRevision, requireCurrentRevision, validStringList, validUniqueIds, versionedJson } from "@/lib/admin/versioned-save";
import type { SkillGroup } from "@/lib/db/types";

export async function GET() {
  const skills = getSkills();
  return versionedJson(skills);
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const skills: unknown = await request.json();
    if (!validUniqueIds(skills) || !skills.every((item) =>
      typeof item.name === "string" && validStringList(item.skills)
    )) {
      return NextResponse.json({ error: "技能数据格式错误" }, { status: 400 });
    }
    const conflict = requireCurrentRevision(request, getSkills());
    if (conflict) return conflict;
    saveSkills(skills as unknown as SkillGroup[]);
    revalidateAboutPages();
    return NextResponse.json({ success: true }, { headers: { "X-Data-Revision": dataRevision(getSkills()) } });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
