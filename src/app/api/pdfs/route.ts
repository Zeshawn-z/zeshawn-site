import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";
import { savePdf } from "@/lib/db/data";
import { randomUUID } from "crypto";

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: `不支持的文件类型: ${file.type}，仅支持 PDF` },
        { status: 400 }
      );
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `文件过大，最大 50MB，当前 ${(file.size / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const id = randomUUID();
    const filename = file.name || "document.pdf";

    const result = savePdf(id, filename, file.size, base64);

    return NextResponse.json({
      ...result,
      url: `/api/pdfs/${id}`,
    });
  } catch {
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
