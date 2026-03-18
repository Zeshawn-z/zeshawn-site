import { NextRequest, NextResponse } from "next/server";
import { getGuestbookEntries, getGuestbookCount, addGuestbookEntry } from "@/lib/db/data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  const entries = getGuestbookEntries(limit, offset);
  const total = getGuestbookCount();

  return NextResponse.json({ entries, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nickname = (body.nickname || "").trim();
    const message = (body.message || "").trim();

    if (!nickname || nickname.length > 50) {
      return NextResponse.json({ error: "昵称不能为空且不超过50字" }, { status: 400 });
    }
    if (!message || message.length > 500) {
      return NextResponse.json({ error: "留言不能为空且不超过500字" }, { status: 400 });
    }

    const entry = addGuestbookEntry(nickname, message);
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
