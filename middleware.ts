import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { proxy } from "./proxy";

export async function middleware(request: NextRequest) {
  // 1. Execute rate limit proxy
  let response = await proxy(request);
  if (response.status === 429) {
    return response;
  }

  // 2. Wrap response for Supabase session refresh
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
          
          // Re-clone to attach new cookies, while preserving headers from proxy
          const nextResponse = NextResponse.next({ request });
          response.headers.forEach((val, key) => {
            nextResponse.headers.set(key, val);
          });
          response = nextResponse;
          
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will securely invoke the refresh token process and write the fresh 
  // tokens to the cookies via the `setAll` method above before the layout renders.
  // Wrapped in try-catch so a stale/missing refresh token doesn't crash the middleware.
  try {
    await supabase.auth.getUser();
  } catch {
    // Stale session — the user will be treated as unauthenticated.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};