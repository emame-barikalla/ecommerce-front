import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createIntlMiddleware({
  locales: ['ar', 'fr', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
  // Arabic is the default for everyone: the browser language does not
  // redirect away from it. Visitors switch with the language menu.
  localeDetection: false,
});

/**
 * Real auth gate for /admin. The previous implementation relied on the
 * `x-invoke-pathname` header (which Next.js never sets), so its redirect
 * block was skipped and the admin UI rendered for everyone. Enforcement now
 * lives here in middleware, and we also refresh the Supabase session cookie
 * (which the old matcher excluded from /admin entirely).
 */
async function handleAdmin(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname.startsWith('/admin/login');

  // Pass the real pathname to the admin layout via a request header so it can
  // decide between the bare login screen and the full AdminShell.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return isLogin ? response : NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Signed in — verify the admin role (RLS lets a user read their own profile).
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    // Authenticated but not an admin: keep them out of the panel.
    return isLogin
      ? response
      : NextResponse.redirect(new URL('/admin/login?error=forbidden', request.url));
  }

  // Admin already logged in and visiting the login page → dashboard.
  if (isLogin) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return handleAdmin(request);
  }
  return intlMiddleware(request);
}

export const config = {
  // `admin` is intentionally NOT excluded anymore (it was in the old matcher),
  // so the gate above runs and Supabase sessions refresh on admin routes.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
