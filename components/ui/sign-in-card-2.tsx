'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, ArrowRight, Loader, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

// ── Google icon ───────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

export function SignInCard2() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  // Router removed because page.tsx handles redirection

  // 3D card effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // ── Google SSO ────────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      console.log("Initiating Google OAuth with redirect: ", `${window.location.origin}/auth/callback`);
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (err) {
        console.error("Google OAuth error:", err);
        throw err;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Google sign-in failed. Check browser console for details.";
      console.error("Full error:", err);
      setError(errorMessage);
      setGoogleLoading(false);
    }
  };

  // ── Email OTP ─────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (!email || !email.includes('@')) throw new Error('Please enter a valid email address');
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (err) throw new Error(err.message);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    let success = false;
    try {
      if (!otp || otp.length !== 6) throw new Error('Please enter a valid 6-digit OTP');
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.verifyOtp({
        email, token: otp, type: 'email',
      });
      if (err) throw new Error(err.message);
      if (data.session) {
        success = true;
        // We do NOT call router.push('/') here because it's handled by onAuthStateChange in page.tsx 
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      if (!success) {
        setIsLoading(false);
      }
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError(null);
  };

  const anyLoading = isLoading || googleLoading;

  return (
    <div className="w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10 px-4"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY } as React.CSSProperties}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div id="lcard" className="relative group w-full h-full">
            {/* Card glow */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              style={{ pointerEvents: "none" }}
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(168,85,247,0.1)",
                  "0 0 20px 5px rgba(168,85,247,0.2)",
                  "0 0 10px 2px rgba(168,85,247,0.1)"
                ],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
            />

            {/* Glass card */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl px-6 py-8 sm:px-8 sm:py-10 border border-white/[0.05] shadow-2xl">

              {/* Decorative overlays wrapper — maintains rounded corners and clipping without breaking stacking context */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="lcard-glare" style={{ pointerEvents: "none" }} />
                <div className="lcard-cyber-lines" style={{ pointerEvents: "none" }}><span /><span /><span /><span /></div>
                <div className="lcard-corner-elements" style={{ pointerEvents: "none" }}><span /><span /><span /><span /></div>
                <div className="lcard-scan-line" style={{ pointerEvents: "none" }} />
                <div className="lcard-particles" style={{ pointerEvents: "none" }}><span /><span /><span /><span /><span /><span /></div>

                <div className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                    backgroundSize: '30px 30px'
                  }}
                />
              </div>

              {/* Header */}
              <div className="text-center space-y-1 mb-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="mx-auto w-12 h-12 rounded-full border border-purple-500/30 flex items-center justify-center relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(6,182,212,0.2))" }}
                >
                  <ShieldCheck className="w-6 h-6 text-purple-400" />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 opacity-50" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-white"
                >
                  Welcome Back
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-cyan-400/80 text-xs tracking-wide"
                >
                  {step === 'email' ? 'Sign in to ParaGuard' : 'Enter your OTP code'}
                </motion.p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <p className="text-xs text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Google button — only shown on email step ── */}
              <AnimatePresence>
                {step === 'email' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4"
                  >
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={anyLoading}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl
                                 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25
                                 text-white text-sm font-medium tracking-wide
                                 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                 cursor-pointer"
                    >
                      {googleLoading ? (
                        <Loader className="w-4 h-4 animate-spin text-white/60" />
                      ) : (
                        <GoogleIcon />
                      )}
                      <span className="text-white/80">
                        {googleLoading ? "Redirecting..." : "Continue with Google"}
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] text-gray-500 tracking-widest font-medium">OR</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email / OTP form */}
              <form onSubmit={step === 'email' ? handleSendOtp : handleVerifyOtp} className="space-y-4">
                <motion.div className="space-y-3">
                  <AnimatePresence mode="wait">
                    {step === 'email' ? (
                      <motion.div
                        key="email-step"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <motion.div
                          className="relative"
                          whileFocus={{ scale: 1.02 }}
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="relative flex items-center overflow-hidden rounded-lg">
                            <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "email" ? 'text-cyan-400' : 'text-white/40'
                              }`} />
                            <Input
                              type="email"
                              placeholder="Email address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setFocusedInput("email")}
                              onBlur={() => setFocusedInput(null)}
                              disabled={anyLoading}
                              className="w-full bg-white/5 border-transparent focus:border-purple-500/40 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 disabled:opacity-50"
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="otp-step"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <motion.div
                          className="relative"
                          whileFocus={{ scale: 1.02 }}
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="relative flex items-center overflow-hidden rounded-lg">
                            <Input
                              type="text"
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                              onFocus={() => setFocusedInput("otp")}
                              onBlur={() => setFocusedInput(null)}
                              disabled={anyLoading}
                              className="w-full bg-white/5 border-transparent focus:border-purple-500/40 text-white placeholder:text-white/30 h-10 transition-all duration-300 px-3 focus:bg-white/10 disabled:opacity-50 tracking-[0.2em] font-mono text-center"
                            />
                          </div>
                          <p className="text-xs text-cyan-400/60 mt-2">Check your email for the OTP code</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={anyLoading || (step === 'email' ? !email : !otp)}
                  className="w-full relative group/button mt-5"
                >
                  <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />

                  <div className="group relative w-full flex justify-center items-center gap-2 border-2 border-purple-500/70 rounded-full h-10
                                  transition-all duration-500 ease-out
                                  hover:border-cyan-400 hover:shadow-lg hover:shadow-purple-500/40
                                  overflow-hidden backdrop-blur-sm
                                  disabled:opacity-40
                                  before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                                  before:via-white/5 before:to-transparent before:translate-x-[-100%]
                                  hover:before:translate-x-[100%] before:transition-transform before:duration-700">

                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-purple-400/20 to-white/0 -z-10"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                      style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                    />

                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 relative z-10"
                        >
                          <Loader className="w-4 h-4 animate-spin text-purple-400" />
                          <span className="text-purple-300 text-sm font-medium">Processing...</span>
                        </motion.div>
                      ) : (
                        <motion.span
                          key="button-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 relative z-10"
                        >
                          <span className="text-white font-medium tracking-wide text-sm transition-all duration-300 group-hover:text-cyan-100">
                            {step === 'email' ? 'Send OTP' : 'Verify OTP'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                          <span className="relative w-3 h-3 bg-cyan-400 rounded-full transition-all duration-500
                                           group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                            <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60"
                              style={{ animationDuration: "2s" }} />
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0
                                    group-hover:border-cyan-400/30 transition-all duration-500
                                    opacity-0 group-hover:opacity-100" />
                  </div>
                </motion.button>
              </form>

              {/* Back to email — outside form */}
              <AnimatePresence>
                {step === 'otp' && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    onClick={handleBackToEmail}
                    className="relative z-50 w-full text-purple-400/70 hover:text-cyan-400 transition-colors text-xs py-2 mt-2 cursor-pointer"
                  >
                    ← Back to email
                  </motion.button>
                )}
              </AnimatePresence>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SignInCard2;