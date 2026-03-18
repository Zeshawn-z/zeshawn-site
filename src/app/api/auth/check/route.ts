import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/auth";

export async function GET() {
  const authed = await isAuthenticated();
  return NextResponse.json({ authenticated: authed });
}
