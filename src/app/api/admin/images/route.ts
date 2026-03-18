import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { getAllImages, deleteImage, cleanupUnusedImages } from "@/lib/db/data";

// GET /api/admin/images — 获取所有图片列表（不含 base64 数据）
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const images = getAllImages();
  return NextResponse.json(images);
}

// DELETE /api/admin/images?id=xxx — 删除单张图片
// POST /api/admin/images?action=cleanup — 清理未使用的图片
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "cleanup") {
    const deletedIds = cleanupUnusedImages();
    return NextResponse.json({ deleted: deletedIds.length, ids: deletedIds });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
  }

  deleteImage(id);
  return NextResponse.json({ success: true });
}
