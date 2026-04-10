"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SignInCard2 from "@/components/ui/sign-in-card-2";

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

  return <SignInCard2 />;
}
