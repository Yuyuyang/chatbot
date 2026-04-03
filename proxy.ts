import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSafeRedirectUrl } from "./lib/auth/redirect";
import { isDevelopmentEnvironment } from "./lib/constants";
import { ChatbotError } from "./lib/errors";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  const isAuthPage = ["/login", "/register"].includes(pathname);
  const isApiRoute = pathname.startsWith("/api/");

  if (!token) {
    if (isAuthPage) {
      return NextResponse.next();
    }

    if (isApiRoute) {
      return new ChatbotError("unauthorized:auth").toResponse();
    }

    const redirectUrl = getSafeRedirectUrl(
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(
      new URL(
        `${base}/login?redirectUrl=${encodeURIComponent(redirectUrl)}`,
        request.url
      )
    );
  }

  if (isAuthPage) {
    const redirectUrl = getSafeRedirectUrl(
      request.nextUrl.searchParams.get("redirectUrl")
    );

    return NextResponse.redirect(
      new URL(redirectUrl === "/" ? `${base}/` : redirectUrl, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
