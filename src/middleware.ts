import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const { pathname, search } = request.nextUrl;

  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    /\.[a-zA-Z0-9]+$/.test(pathname);

  if (isPublicAsset || pathname.startsWith("/api/auth")) {
    if ((pathname === "/login" || pathname === "/register") && request.auth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const publicPageRoutes = new Set([
    "/",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/products",
  ]);

  if (publicPageRoutes.has(pathname) || pathname.startsWith("/products/")) {
    if ((pathname === "/login" || pathname === "/register") && request.auth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (!request.auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  if (isProtectedRoute && !request.auth?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
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
    "/api/:path*",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/products/:path*",
    "/products",
  ],
};
