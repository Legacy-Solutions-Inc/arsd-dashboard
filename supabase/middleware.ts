import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(({ name, value }) => ({
              name,
              value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    const { data: { user }, error } = await supabase.auth.getUser();

    // Check if user is trying to access protected routes
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      if (error || !user) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      // Check user role and status
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      // Block access for pending or inactive users
      if (userData.status === 'pending' || userData.status === 'inactive') {
        return NextResponse.redirect(new URL("/pending-approval", request.url));
      }

      // Block access for pending role users
      if (userData.role === 'pending') {
        return NextResponse.redirect(new URL("/pending-approval", request.url));
      }

      // Role-based route protection
      const path = request.nextUrl.pathname;

      // Superadmin-only routes
      if (path.startsWith("/dashboard/users") && userData.role !== 'superadmin') {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Project Manager, Project Inspector, Superadmin-only routes
      if (path.startsWith("/dashboard/uploads") && userData.role !== 'project_manager' && userData.role !== 'project_inspector' && userData.role !== 'superadmin') {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // HR, Superadmin-only routes
      if (path.startsWith("/dashboard/website-details") && userData.role !== 'hr' && userData.role !== 'superadmin') {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if ((request.nextUrl.pathname === "/sign-in" || request.nextUrl.pathname === "/sign-up") && user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
