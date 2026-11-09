import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";
import { AREA_ROLE, ROLE_HOME } from "@/lib/roles";

// Optimistic check only (cookie signature + role). The real authorization,
// including account status, happens in requireRole() on the server.
export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const area = "/" + request.nextUrl.pathname.split("/")[1];
  const allowed = AREA_ROLE[area];
  if (allowed && allowed !== session.role) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/karyawan/:path*", "/akun/:path*"],
};
