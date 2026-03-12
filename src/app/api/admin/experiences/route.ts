import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getExperiences, saveExperiences } from "@/lib/data";

export async function GET() {
  const experiences = getExperiences();
  return NextResponse.json(experiences);
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const experiences = await request.json();
    saveExperiences(experiences);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
