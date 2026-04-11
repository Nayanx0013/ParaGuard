'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export function SignInCard2() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();

  // For 3D card effect
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

  // Step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (err) {
        throw new Error(err.message);
      }

      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      const supabase = createClient();
      const { data, error: err } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (err) {
        throw new Error(err.message);
      }

      if (data.session) {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

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
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div className="relative group">
            {/* Card glow effect */}
            <motion.div 
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(168,85,247,0.1)",
                  "0 0 20px 5px rgba(168,85,247,0.2)",
                  "0 0 10px 2px rgba(168,85,247,0.1)"
                ],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut", 
                repeatType: "mirror" 
              }}
            />

            {/* Traveling light beam effect */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              {/* Top light beam */}
              <motion.div 
                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  left: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  left: {
                    duration: 2.5, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 1
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror"
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror"
                  }
                }}
              />
              
              {/* Right light beam */}
              <motion.div 
                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  top: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  top: {
                    duration: 2.5, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 0.6
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.6
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.6
                  }
                }}
              />
              
              {/* Bottom light beam */}
              <motion.div 
                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  right: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  right: {
                    duration: 2.5, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.2
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.2
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.2
                  }
                }}
              />
              
              {/* Left light beam */}
              <motion.div 
                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  bottom: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  bottom: {
                    duration: 2.5, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.8
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.8
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.8
                  }
                }}
              />
            </div>

            {/* Card border glow */}
            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/3 via-white/7 to-white/3 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
            
            {/* Glass card background */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
              {/* Subtle card inner patterns */}
              <div className="absolute inset-0 opacity-[0.03]" 
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: '30px 30px'
                }}
              />

              {/* Logo and header */}
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

              {/* Error message */}
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

              {/* Login form */}
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
                        {/* Email input */}
                        <motion.div 
                          className="relative"
                          whileFocus={{ scale: 1.02 }}
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="relative flex items-center overflow-hidden rounded-lg">
                            <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                              focusedInput === "email" ? 'text-cyan-400' : 'text-white/40'
                            }`} />
                            
                            <Input
                              type="email"
                              placeholder="Email address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setFocusedInput("email")}
                              onBlur={() => setFocusedInput(null)}
                              disabled={isLoading}
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
                        {/* OTP input */}
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
                              disabled={isLoading}
                              className="w-full bg-white/5 border-transparent focus:border-purple-500/40 text-white placeholder:text-white/30 h-10 transition-all duration-300 px-3 focus:bg-white/10 disabled:opacity-50 tracking-[0.2em] font-mono text-center"
                            />
                          </div>
                          <p className="text-xs text-cyan-400/60 mt-2">Check your email for the OTP code</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Glowing Send OTP / Verify OTP button — matches navbar Login button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || (step === 'email' ? !email : !otp)}
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

                    {/* Background glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Shimmer on loading */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-purple-400/20 to-white/0 -z-10"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ 
                        duration: 1.5, 
                        ease: "easeInOut", 
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      style={{ 
                        opacity: isLoading ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                      }}
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
                          {/* Animated dot */}
                          <span className="relative w-3 h-3 bg-cyan-400 rounded-full transition-all duration-500
                                           group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                            <div
                              className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60"
                              style={{ animationDuration: "2s" }}
                            />
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0
                                    group-hover:border-cyan-400/30 transition-all duration-500
                                    opacity-0 group-hover:opacity-100" />
                  </div>
                </motion.button>

                {/* Back button (OTP step) */}
                {step === 'otp' && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError(null);
                    }}
                    className="w-full text-purple-400/70 hover:text-cyan-400 transition-colors text-xs py-2"
                  >
                    ← Back to email
                  </motion.button>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SignInCard2;