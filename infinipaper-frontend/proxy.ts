import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/projects", "/profile"];
const AUTH_PAGES = ["/login", "/register"];

function isProtected(pathname: string): boolean {
  return (
    pathname === "/" ||
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("session");

  if (isProtected(pathname) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/projects/:path*", "/profile/:path*", "/login", "/register"],
};
