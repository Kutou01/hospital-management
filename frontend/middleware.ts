import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define protected routes
  const protectedRoutes = [
    '/admin',
    '/doctor',
    '/patient',
    '/nurse',
    '/receptionist'
  ]

  // Define public routes that should redirect to dashboard if authenticated
  const authRoutes = [
    '/auth/login',
    '/auth/register'
  ]

  const { pathname } = req.nextUrl

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes
  if (isAuthRoute && session) {
    // Get user role from profiles table
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userData?.role) {
      const dashboardUrl = new URL(`/${userData.role}/dashboard`, req.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Role-based access control for protected routes
  if (isProtectedRoute && session) {
    // Get user role from profiles table
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userData?.role) {
      const userRole = userData.role

      // Extract the role from the pathname (e.g., /admin/dashboard -> admin)
      const pathRole = pathname.split('/')[1]

      // Check if user has access to this role-based route
      if (pathRole !== userRole) {
        // Redirect to user's appropriate dashboard
        const dashboardUrl = new URL(`/${userRole}/dashboard`, req.url)
        return NextResponse.redirect(dashboardUrl)
      }
    } else {
      // User exists in auth but not in profiles table
      // Redirect to login to handle this edge case
      const redirectUrl = new URL('/auth/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
