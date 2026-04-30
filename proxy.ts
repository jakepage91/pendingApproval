import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth routes and public assets through
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/portraits") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
