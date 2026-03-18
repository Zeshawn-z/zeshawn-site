import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/db/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = getImage(id);

  if (!image) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }

  const buffer = Buffer.from(image.data, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
