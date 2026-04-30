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

  // /share/* — let OG crawlers (Slack, etc.) through; redirect real browsers
  if (pathname.startsWith("/share")) {
    const ua = req.headers.get("user-agent") ?? "";
    const isBot = /slackbot|twitterbot|facebookexternalhit|linkedinbot|whatsapp|telegram|discordbot|googlebot/i.test(ua);
    if (isBot) return NextResponse.next();
    return NextResponse.redirect(new URL(req.auth ? "/manager" : "/login", req.url));
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/manager", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
