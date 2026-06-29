import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/app/_lib/supabase-env";
import { routing } from "@/i18n/routing";

const LOGIN_PATH = "/admin-portal/login";
const ADMIN_HOME = "/admin-portal/products";
const intlProxy = createIntlMiddleware(routing);

// Refreshes the Supabase session on every admin request and guards the
// /admin-portal/* routes: unauthenticated users are bounced to the login page,
// and an already-authenticated admin visiting the login page is sent to the
// dashboard. (Next.js 16 renamed Middleware to Proxy; behavior is unchanged.)
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith("/admin-portal")) {
    return intlProxy(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && path !== LOGIN_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }

  if (user && path === LOGIN_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_HOME;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin-portal/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
