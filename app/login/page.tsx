"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SignInCard2 from "@/components/ui/sign-in-card-2";
import ShaderBackground from "@/components/ui/shader-background";

const cyclingPhrases = [
  "Paraphrase smarter.",
  "Detect plagiarism instantly.",
  "Write with confidence.",
  "Rewrite in seconds.",
];

const typewriterText = "AI-POWERED WRITING ASSISTANT";

export default function Login() {
  const router = useRouter();

  // Auth check — unchanged
  useEffect(() => {
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

  // Typewriter state
  const [displayed, setDisplayed] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);

  // Word cycling state
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Typewriter effect
  useEffect(() => {
    if (charIndex < typewriterText.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + typewriterText[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, 55);
      return () => clearTimeout(timeout);
    } else {
      setTypewriterDone(true);
    }
  }, [charIndex]);

  // Word cycling effect — starts after typewriter finishes
  useEffect(() => {
    if (!typewriterDone) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % cyclingPhrases.length);
        setVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, [typewriterDone]);

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center gap-6"
      style={{ minHeight: "calc(100vh - 65px)" }}
    >
      {/* Full page shader background */}
      <ShaderBackground />

      {/* Content sits on top */}
      <div className="relative z-10 flex flex-col items-center gap-5 text-center px-4">

        {/* 1. ParaGuard AI — large, animated gradient */}
        <h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(90deg, #a855f7, #06b6d4, #a855f7)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "gradientShift 3s linear infinite",
          }}
        >
          ParaGuard AI
        </h1>

        {/* 2. Typewriter label */}
        <p className="text-sm md:text-base font-semibold tracking-[0.25em] text-cyan-400 min-h-[1.5rem]">
          {displayed}
          {!typewriterDone && (
            <span
              className="inline-block w-[2px] h-[1em] bg-cyan-400 ml-1 align-middle"
              style={{ animation: "blink 0.7s step-end infinite" }}
            />
          )}
        </p>

        {/* 3. Cycling subtitle */}
        <p
          className="text-base md:text-lg text-gray-300 min-h-[1.75rem] transition-all duration-400"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          {cyclingPhrases[phraseIndex]}
        </p>

        {/* Sign in card */}
        <SignInCard2 />

        <p className="text-xs text-gray-500">
          No account needed — just your email.
        </p>
      </div>

      {/* Keyframe styles */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}