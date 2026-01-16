import { auth } from "@/auth"
import type { NextRequest } from "next/server"

type AuthedRequest = NextRequest & { auth?: unknown }

export default auth((req: AuthedRequest) => {
  const pathname = req.nextUrl.pathname

  // NextAuthのエンドポイントは常に素通し
  if (pathname.startsWith("/api/auth")) return

  const isLoggedIn = !!req.auth
  const isLoginPage = pathname.startsWith("/login")

  // APIはリダイレクトではなく401（クライアントfetchを壊さない）
  if (!isLoggedIn && pathname.startsWith("/api")) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!isLoggedIn && !isLoginPage) {
    const url = new URL("/login", req.nextUrl.origin)
    url.searchParams.set("callbackUrl", req.nextUrl.href)
    return Response.redirect(url)
  }

  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/", req.nextUrl.origin))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}


