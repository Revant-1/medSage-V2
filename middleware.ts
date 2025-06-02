import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"

// List of paths that don't require authentication
const publicPaths = ["/", "/login", "/register", "/public-chat"]

// API paths that don't require authentication check
const publicApiPaths = ["/api/auth/", "/api/chat"]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if the path is public
  const isPublicPath = publicPaths.some((publicPath) => path === publicPath || path.startsWith(publicPath))

  // Check if the path is a public API path
  const isPublicApiPath = publicApiPaths.some((apiPath) => path.startsWith(apiPath))

  // Get the token from the cookies
  const token = request.cookies.get("auth-token")?.value

  // If the path is public or a public API, allow access
  if (isPublicPath || isPublicApiPath) {
    // If user is logged in and trying to access login/register, redirect to dashboard
    if (token && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // If no token, redirect to login
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Verify the token
  const user = await verifyToken(token)

  // If token is invalid, redirect to login
  if (!user) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Allow access to protected routes
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
