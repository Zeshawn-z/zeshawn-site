import { NextRequest, NextResponse } from "next/server";
import { getPdf } from "@/lib/db/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pdf = getPdf(id);

  if (!pdf) {
    return NextResponse.json({ error: "PDF 不存在" }, { status: 404 });
  }

  const buffer = Buffer.from(pdf.data, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
