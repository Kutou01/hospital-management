import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // TEMPORARILY DISABLE MIDDLEWARE FOR DEBUGGING
  console.log(`🛡️ [Middleware] DISABLED - Allowing all requests to: ${req.nextUrl.pathname}`)
  return NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

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
    console.log(`[Middleware] Unauthenticated user accessing protected route: ${pathname}`)
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes
  if (isAuthRoute && session) {
    console.log(`🛡️ [Middleware] Authenticated user ${session.user.id} accessing auth route: ${pathname}`)

    // Check if this is a fresh login/register by looking for specific query params
    const url = new URL(req.url)
    const hasLoginMessage = url.searchParams.has('message')
    const hasRedirectParam = url.searchParams.has('redirectTo')
    const isFromLogin = url.searchParams.has('from_login')

    // Allow access if there are specific query parameters or if coming from login
    if (hasLoginMessage || hasRedirectParam || isFromLogin) {
      console.log(`🛡️ [Middleware] Allowing access to auth route due to query params`)
      return response
    }

    console.log(`🛡️ [Middleware] No special query params, proceeding with redirect logic`)

    // Get user role from profiles table with retry logic
    let userData = null
    let retryCount = 0
    const maxRetries = 3 // Reduce retries to avoid long delays

    while (!userData && retryCount < maxRetries) {
      console.log(`🛡️ [Middleware] Attempt ${retryCount + 1}/${maxRetries} to fetch user role`)
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('🛡️ [Middleware] Error fetching user role:', error)
        break
      } else if (data) {
        userData = data
        console.log(`🛡️ [Middleware] Successfully fetched user role: ${userData.role}`)
        break
      }

      retryCount++
      if (retryCount < maxRetries) {
        // Reduce wait time between retries
        const waitTime = 500 * retryCount
        console.log(`🛡️ [Middleware] Waiting ${waitTime}ms before retry`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    if (userData?.role) {
      console.log(`🛡️ [Middleware] Redirecting to dashboard for role: ${userData.role}`)
      const dashboardUrl = new URL(`/${userData.role}/dashboard`, req.url)
      return NextResponse.redirect(dashboardUrl)
    } else {
      console.log(`🛡️ [Middleware] Could not determine user role after ${maxRetries} attempts, allowing access`)
      // Allow access instead of blocking if we can't determine role
      return response
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
