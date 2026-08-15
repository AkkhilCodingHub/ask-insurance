import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const host = req.nextUrl.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";

  if (isLocal) {
    return NextResponse.redirect("http://localhost:3001/admin/login");
  }

  // On live deployment, redirect to /admin/login (Broker Admin Login Page)
  return NextResponse.redirect(new URL("/admin/login", req.url));
}
