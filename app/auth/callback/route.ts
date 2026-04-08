import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") || "/dashboard";
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNextPath, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", requestUrl.origin));
}