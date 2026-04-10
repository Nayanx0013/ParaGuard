"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SignInCard2 from "@/components/ui/sign-in-card-2";
import { DottedSurface } from "@/components/ui/dotted-surface";

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/");
        router.refresh();
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="relative min-h-screen w-full">
      <DottedSurface />
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <SignInCard2 />
      </div>
    </div>
  );
}
