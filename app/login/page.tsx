"use client";

import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { DottedSurface } from "@/components/ui/dotted-surface";
import TocDialog from "@/components/ui/terms-conditions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Login() {
  const id = useId();
  const router = useRouter();
  
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    
    const supabase = createClient();

    try {
      if (!isLoginMode) {
        // Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage("Account created successfully! Check your email to verify your account or try logging in.");
        setIsLoginMode(true);
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setMessage(null);
  };

  return (
    <main className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Background */}
      <DottedSurface />

      {/* Glow effect matching DemoOne */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-10 left-1/2 size-full -translate-x-1/2 rounded-full",
          "bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.25),transparent_40%)]",
          "blur-[30px] -z-10"
        )}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="w-full max-w-[400px] bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm mb-2"
            aria-hidden="true"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 text-center">
            {isLoginMode ? "Welcome back" : "Sign up to ParaphraseAI"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {isLoginMode ? "Enter your credentials to access your dashboard." : "We just need a few details to get you started."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm rounded-lg relative z-20">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-sm rounded-lg relative z-20">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5 relative z-20">
          <div className="space-y-4">
            {!isLoginMode && (
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>Full name</Label>
                <Input
                  id={`${id}-name`}
                  placeholder="Subhadeep Roy"
                  type="text"
                  required={!isLoginMode}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input
                id={`${id}-email`}
                placeholder="subha9.5roy350@gmail.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-password`}>Password</Label>
              <Input
                id={`${id}-password`}
                placeholder="Enter your password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
            {isLoading ? "Please wait..." : (isLoginMode ? "Sign In" : "Sign Up")}
          </Button>
        </form>

        <div className="before:bg-gray-200 dark:before:bg-gray-800 after:bg-gray-200 dark:after:bg-gray-800 flex items-center gap-3 before:h-px before:flex-1 after:h-px after:flex-1 my-6 relative z-20">
          <span className="text-gray-500 dark:text-gray-400 text-xs">Or</span>
        </div>

        <Button 
          type="button"
          variant="outline" 
          className="w-full mb-6 h-11 relative z-20"
          onClick={toggleMode}
        >
          {isLoginMode ? "Create an account instead" : "Already have an account? Sign in"}
        </Button>

        {!isLoginMode && (
          <p className="text-gray-500 dark:text-gray-400 text-center text-xs relative z-30">
            By signing up you agree to our <TocDialog />
          </p>
        )}
      </motion.div>
    </main>
  );
}
