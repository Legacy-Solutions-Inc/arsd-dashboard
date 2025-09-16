import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({
            name,
            value,
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get authenticated user - more secure than session
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Auth user error:', error)
  }

  // Check if user is trying to access protected routes
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (error || !user) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    // Check user role and status
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    // Block access for pending or inactive users
    if (userData.status === 'pending' || userData.status === 'inactive') {
      return NextResponse.redirect(new URL("/pending-approval", req.url))
    }

    // Block access for pending role users
    if (userData.role === 'pending') {
      return NextResponse.redirect(new URL("/pending-approval", req.url))
    }

    // Role-based route protection
    const path = req.nextUrl.pathname

    // Base dashboard - Superadmin only
    if (path === "/dashboard" && userData.role !== 'superadmin') {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Superadmin-only routes
    if (path.startsWith("/dashboard/users") && userData.role !== 'superadmin') {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }


    // Project Manager, Project Inspector, Superadmin-only routes
    if (path.startsWith("/dashboard/uploads") && userData.role !== 'project_manager' && userData.role !== 'project_inspector' && userData.role !== 'superadmin') {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // HR, Superadmin-only routes
    if (path.startsWith("/dashboard/website-details") && userData.role !== 'hr' && userData.role !== 'superadmin') {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if ((req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up") && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
