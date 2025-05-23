import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Kiểm tra xem người dùng đã đăng nhập chưa
  const authToken = request.cookies.get("auth_token")
  const userRole = request.cookies.get("user_role")?.value
  const pathname = request.nextUrl.pathname

  // Kiểm tra các protected routes
  const isAdminPath = pathname.startsWith("/admin")
  const isDoctorPath = pathname.startsWith("/doctor")
  const isPatientPath = pathname.startsWith("/patient")
  const isProtectedPath = isAdminPath || isDoctorPath || isPatientPath

  // Nếu cố gắng truy cập trang protected mà không có xác thực
  if (isProtectedPath && !authToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Kiểm tra quyền truy cập dựa trên role
  if (authToken && userRole) {
    // Admin chỉ có thể truy cập /admin/*
    if (isAdminPath && userRole !== "admin") {
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }

    // Doctor chỉ có thể truy cập /doctor/*
    if (isDoctorPath && userRole !== "doctor") {
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }

    // Patient chỉ có thể truy cập /patient/*
    if (isPatientPath && userRole !== "patient") {
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/patient/:path*"],
}
