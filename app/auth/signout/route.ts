import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Attempt sign-out, but don't let a stale/missing refresh token
  // prevent the user from being logged out locally.
  try {
    await supabase.auth.signOut();
  } catch {
    // Token was already revoked or expired — safe to ignore.
  }

  revalidatePath("/", "layout");
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 302,
  });
}
