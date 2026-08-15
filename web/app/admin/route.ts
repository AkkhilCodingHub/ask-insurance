import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const host = req.nextUrl.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";

  if (isLocal) {
    return NextResponse.redirect("http://localhost:3001");
  }

  // On Vercel live production deployment, redirect directly to admin dashboard route on live domain
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
