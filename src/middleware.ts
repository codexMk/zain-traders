import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image";

  if (isPublicRoute) {
    if ((pathname === "/login" || pathname === "/register") && request.auth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const protectedPrefixes = [
    "/dashboard",
    "/customers",
    "/suppliers",
    "/purchases",
    "/inventory",
    "/expenses",
    "/reports",
    "/settings",
    "/accounting",
    "/billing",
    "/rate-history",
  ];

  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedRoute && !request.auth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/customers/:path*",
    "/suppliers/:path*",
    "/purchases/:path*",
    "/inventory/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/accounting/:path*",
    "/billing/:path*",
    "/rate-history/:path*",
    "/login",
    "/register",
  ],
};
