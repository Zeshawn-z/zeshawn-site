import { NextRequest, NextResponse } from "next/server";
import { getGuestbookEntries, getGuestbookCount, addGuestbookEntry, getSiteConfig } from "@/lib/db/data";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getIpLocation } from "@/lib/ip-location";
import { revalidateGuestbookPage } from "@/lib/cache/revalidate-site";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  const entries = getGuestbookEntries(limit, offset);
  const total = getGuestbookCount();
  const cfg = getSiteConfig();
  const guestbookEnabled = cfg["guestbook.enabled"] !== "false";

  return NextResponse.json({ entries, total, page, pages: Math.ceil(total / limit), guestbookEnabled });
}

export async function POST(request: NextRequest) {
  try {
    // 检查留言板开关
    const cfg = getSiteConfig();
    if (cfg["guestbook.enabled"] === "false") {
      return NextResponse.json({ error: "留言板已关闭" }, { status: 403 });
    }

    // 速率限制：每 IP 每分钟最多 5 次留言
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = checkRateLimit(`guestbook:${ip}`, 5, 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: `操作太频繁，请 ${Math.ceil(retryAfterMs / 1000)} 秒后再试` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const nickname = (body.nickname || "").trim();
    const message = (body.message || "").trim();

    if (!nickname || nickname.length > 50) {
      return NextResponse.json({ error: "昵称不能为空且不超过50字" }, { status: 400 });
    }
    if (!message || message.length > 500) {
      return NextResponse.json({ error: "留言不能为空且不超过500字" }, { status: 400 });
    }

    // 异步查询 IP 归属地（不阻塞主流程）
    const location = await getIpLocation(ip);

    const entry = addGuestbookEntry(nickname, message, location);
    revalidateGuestbookPage();
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
