import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export function dataRevision(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

export function versionedJson(data: unknown) {
  return NextResponse.json(data, {
    headers: { "X-Data-Revision": dataRevision(data), "Cache-Control": "no-store" },
  });
}

export function requireCurrentRevision(request: Request, data: unknown) {
  const expected = request.headers.get("If-Match");
  if (!expected) {
    return NextResponse.json({ error: "缺少数据版本，请刷新后台后重试" }, { status: 428 });
  }
  if (expected !== dataRevision(data)) {
    return NextResponse.json({ error: "数据已在别处变更，当前修改仍保留在页面中；请先备份改动再刷新" }, { status: 409 });
  }
  return null;
}

export function validStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validUniqueIds(value: unknown): value is Array<Record<string, unknown> & { id: string }> {
  return Array.isArray(value) &&
    value.every((item) => item && typeof item.id === "string" && item.id.length > 0) &&
    new Set(value.map((item) => item.id)).size === value.length;
}
