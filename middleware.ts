import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Kiểm tra xem người dùng đã đăng nhập chưa
  const authToken = request.cookies.get("auth_token")
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin")

  // Nếu cố gắng truy cập trang admin mà không có xác thực
  if (isAdminPath && !authToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/admin/:path*"],
}
