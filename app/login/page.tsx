"use client";

import { useId, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { DottedSurface } from "@/components/ui/dotted-surface";
import TocDialog from "@/components/ui/terms-conditions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type AuthStep = "signup-email" | "signup-otp" | "signin-email" | "signin-otp";

export default function Login() {
  const id = useId();
  const router = useRouter();
  
  const [step, setStep] = useState<AuthStep>("signin-email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      setMessage("OTP sent to your email. Check your inbox and paste it below.");
      setOtpSent(true);
      
      if (step === "signup-email") {
        setStep("signup-otp");
      } else {
        setStep("signin-otp");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      // If this is signup, update user profile
      if (step === "signup-otp" && name) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { full_name: name },
        });
        
        if (updateError) {
          console.error("Failed to update profile:", updateError);
        }
      }

      setMessage("Verified successfully! Redirecting to paraphrase page...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    if (step.includes("signup")) {
      setStep("signin-email");
    } else {
      setStep("signup-email");
    }
    setError(null);
    setMessage(null);
    setOtp("");
    setOtpSent(false);
    setName("");
    setEmail("");
  };

  const isSignup = step.includes("signup");
  const isOtpStep = step.includes("otp");

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
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
            {isOtpStep 
              ? "Verify OTP" 
              : (isSignup ? "Sign up to ParaphraseAI" : "Welcome back")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {isOtpStep
              ? "Enter the OTP sent to your email"
              : (isSignup 
                ? "We just need a few details to get you started." 
                : "Enter your email to receive a login OTP.")}
          </p>
        </div>

        {/* Error message container - reserved height to prevent layout shift */}
        <div className="min-h-[52px] mb-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm rounded-lg relative z-20">
              {error}
            </div>
          )}
        </div>
        
        {/* Success message container - reserved height to prevent layout shift */}
        <div className="min-h-[52px] mb-6">
          {message && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-sm rounded-lg relative z-20">
              {message}
            </div>
          )}
        </div>

        <form onSubmit={isOtpStep ? handleVerifyOtp : handleSendOtp} className="space-y-5 relative z-20">
          <div className="space-y-4">
            {isSignup && !isOtpStep && (
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>Full name</Label>
                <Input
                  id={`${id}-name`}
                  placeholder="John Doe"
                  type="text"
                  required={isSignup}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
            
            {!isOtpStep && (
              <div className="space-y-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input
                  id={`${id}-email`}
                  placeholder="your@email.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            {isOtpStep && (
              <div className="space-y-2">
                <Label htmlFor={`${id}-otp`}>One-Time Password (OTP)</Label>
                <Input
                  id={`${id}-otp`}
                  placeholder="000000"
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sent to: <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                </p>
              </div>
            )}
          </div>
          
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
            {isLoading 
              ? "Please wait..." 
              : (isOtpStep ? "Verify OTP" : (isSignup ? "Send OTP" : "Send OTP"))}
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
          disabled={isLoading}
        >
          {isOtpStep 
            ? (isSignup ? "Back to sign up" : "Back to sign in")
            : (isSignup ? "Already have an account? Sign in" : "Create a new account")}
        </Button>

        {isSignup && !isOtpStep && (
          <p className="text-gray-500 dark:text-gray-400 text-center text-xs relative z-30">
            By signing up you agree to our <TocDialog />
          </p>
        )}
      </motion.div>
    </main>
  );
}
