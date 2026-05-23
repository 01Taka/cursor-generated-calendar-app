export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/day/:path*", "/week", "/reflect/:path*", "/settings/:path*"],
};
