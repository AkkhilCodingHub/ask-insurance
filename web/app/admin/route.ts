import { NextResponse } from "next/server";

export async function GET() {
  const adminTargetUrl = process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : (process.env.ADMIN_URL || "/admin-portal");

  return NextResponse.redirect(new URL(adminTargetUrl));
}
