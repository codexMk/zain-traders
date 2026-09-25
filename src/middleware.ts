export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/suppliers/:path*",
    "/customers/:path*",
    "/purchases/:path*",
    "/billing/:path*",
    "/inventory/:path*",
    "/accounting/:path*",
    "/rate-history/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
