import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getSkills, saveSkills } from "@/lib/db/data";

export async function GET() {
  const skills = getSkills();
  return NextResponse.json(skills);
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const skills = await request.json();
    saveSkills(skills);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
