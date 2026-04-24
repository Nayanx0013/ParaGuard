"use client";

import React, { useState } from "react";
import { Orbitron } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, ShieldCheck, Sparkles } from "lucide-react";

import TextEditor from "@/components/TextEditor";
import ToneSelector from "@/components/ToneSelector";
import ResultCard from "@/components/ResultCard";
import PlagiarismScore from "@/components/PlagiarismScore";
import PlagiarismChecker from "@/components/PlagiarismChecker";
import HumanizerPanel from "@/components/HumanizerPanel";
import { GridGlowBackground } from "@/components/ui/grid-glow-background";
import { createClient } from "@/lib/supabase/client";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ── Neon card CSS (no GlowingShadow import needed anymore) ────────────────────
const NEON_STYLES = `
  .neon-card {
    position: relative;
    border-radius: 18px;
    background: transparent;
    padding: 1.5px;
    width: 100%;
  }
  /* Animated glowing neon border */
  .neon-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 18px;
    padding: 1.5px;
    background: linear-gradient(135deg, #7c3aed, #06b6d4, #a855f7, #0ea5e9, #7c3aed);
    background-size: 300% 300%;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    animation: neon-border-flow 4s linear infinite;
    z-index: 0;
  }
  /* Outer neon bloom glow */
  .neon-card::after {
    content: "";
    position: absolute;
    inset: -4px;
    border-radius: 22px;
    background: transparent;
    box-shadow:
      0 0 10px 2px rgba(124,58,237,0.45),
      0 0 24px 5px rgba(6,182,212,0.18),
      0 0 50px 10px rgba(124,58,237,0.08);
    pointer-events: none;
    z-index: 0;
    animation: neon-pulse 4s ease-in-out infinite;
  }
  @keyframes neon-border-flow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes neon-pulse {
    0%, 100% {
      box-shadow:
        0 0 10px 2px rgba(124,58,237,0.45),
        0 0 24px 5px rgba(6,182,212,0.18),
        0 0 50px 10px rgba(124,58,237,0.08);
    }
    50% {
      box-shadow:
        0 0 14px 3px rgba(6,182,212,0.55),
        0 0 35px 8px rgba(124,58,237,0.25),
        0 0 65px 14px rgba(6,182,212,0.1);
    }
  }
  /* Dark inner shell with grid texture */
  .neon-card-inner {
    position: relative;
    z-index: 1;
    border-radius: 16px;
    background: rgba(8,8,16,0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    overflow: visible;
    width: 100%;
  }
  /* Grid lines texture */
  .neon-card-inner::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background-image:
      linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }
  /* Corner glow accents inside */
  .neon-card-inner::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background:
      radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.07) 0%, transparent 55%),
      radial-gradient(ellipse at 100% 100%, rgba(6,182,212,0.05) 0%, transparent 55%);
    pointer-events: none;
    z-index: 0;
  }
  .neon-card-inner > * { position: relative; z-index: 1; }
  /* Ensure portaled dropdowns always float above card stacking contexts */
  body > [data-export-portal] { z-index: 99999 !important; }
  .neon-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(124,58,237,0.4), rgba(6,182,212,0.4), transparent);
    position: relative;
    z-index: 1;
  }
  .neon-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 11px;
    border-radius: 9999px;
    font-size: 10.5px;
    font-weight: 500;
    color: rgba(165,180,252,0.95);
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.35);
  }
`;

type WebCheckMeta = {
  sampledSentenceCount: number;
  matchedSentenceCount: number;
  failedSentenceChecks: number;
  webProvidersUsed: string[];
  webProvidersFailed: string[];
  degradedWebCheck: boolean;
};

type WebScoreBand = {
  score: number;
  low: number;
  high: number;
};

type Tab = "paraphraser" | "plagiarism" | "humanizer";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("paraphraser");

  // ── Paraphraser state — all unchanged ─────────────────────────────────────
  const [originalText, setOriginalText] = useState("");
  const [selectedTone, setSelectedTone] = useState("Formal");
  const [rewrittenText, setRewrittenText] = useState("");
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [webScore, setWebScore] = useState<WebScoreBand | null>(null);
  const [webCheckMeta, setWebCheckMeta] = useState<WebCheckMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Handlers — all unchanged ──────────────────────────────────────────────

  const handleParaphrase = async () => {
    if (!originalText.trim()) { setError("Please enter some text to paraphrase."); return; }
    setError(null);
    setIsParaphrasing(true);
    setRewrittenText("");
    setSimilarityScore(null);
    setWebScore(null);
    setWebCheckMeta(null);
    try {
      const response = await fetch("/api/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText, tone: selectedTone }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) throw new Error("Please login first to use paraphrasing and plagiarism checks.");
        throw new Error(data.error || "Failed to paraphrase text");
      }
      setRewrittenText(data.result);
      checkSimilarity(originalText, data.result, selectedTone);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred."));
    } finally {
      setIsParaphrasing(false);
    }
  };

  const checkSimilarity = async (original: string, rewritten: string, tone: string) => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/plagiarism-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText: original, rewrittenText: rewritten }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) throw new Error("Please login first to run plagiarism checks.");
        throw new Error(data.error || "Plagiarism check failed.");
      }
      if (data.degradedWebCheck) setError("Web matching was partially unavailable. Results are best-effort sample indicators.");
      setSimilarityScore(data.structuralSimilarityToOriginal);
      setWebScore(data.webPlagiarismScore);
      setWebCheckMeta({
        sampledSentenceCount: data.sampledSentenceCount ?? 0,
        matchedSentenceCount: data.matchedSentenceCount ?? 0,
        failedSentenceChecks: data.failedSentenceChecks ?? 0,
        webProvidersUsed: data.webProvidersUsed ?? [],
        webProvidersFailed: data.webProvidersFailed ?? [],
        degradedWebCheck: Boolean(data.degradedWebCheck),
      });
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: insertError } = await supabase.from("paraphrases").insert({
          user_id: user.id,
          original_text: original,
          paraphrased_text: rewritten,
          tone,
          similarity_score: data.structuralSimilarityToOriginal,
          web_score: data.webPlagiarismScore?.score ?? 0,
        });
        if (insertError) console.error("Failed to save history:", insertError.message);
      }
    } catch (err: unknown) {
      console.error("Similarity check error:", err);
      setError(getErrorMessage(err, "Similarity check failed."));
    } finally {
      setIsChecking(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    { id: "paraphraser", label: "Paraphraser", icon: <Shuffle size={15} />, description: "Rewrite and improve text" },
    { id: "plagiarism", label: "Plagiarism Checker", icon: <ShieldCheck size={15} />, description: "Ensure 100% originality" },
    { id: "humanizer", label: "AI Humanizer", icon: <Sparkles size={15} />, description: "Bypass AI detectors & humanize text" },
  ];

  return (
    <GridGlowBackground
      backgroundColor="#0a0a0a"
      gridColor="rgba(255, 255, 255, 0.05)"
      gridSize={50}
      glowColors={["#4A00E0", "#8E2DE2", "#4A00E0"]}
      glowCount={10}
    >
      <style>{NEON_STYLES}</style>

      <div className="min-h-screen w-full py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="max-w-4xl mx-auto relative"
        >
          {/* ── Title ─────────────────────────────────────────────────────── */}
          <div className="text-center mb-10">
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className={`${orbitron.className} text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400`}
            >
              AI Paraphraser & Plagiarism Checker
            </motion.h1>
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 font-light">
              Bypass AI detectors, fix grammar instantly, and ensure 100% originality.
            </p>
          </div>

          {/* ── Tab Switcher ───────────────────────────────────────────────── */}
          <div className="flex gap-2 mb-6 p-1.5 bg-white/5 dark:bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl w-fit mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                            transition-all duration-300 focus:outline-none
                            ${activeTab === tab.id ? "text-white" : "text-gray-400 hover:text-gray-200"}`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/60 to-cyan-600/40 border border-white/10 shadow-lg shadow-purple-500/20"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">{tab.icon}{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Tab subtitle ──────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.p
              key={activeTab}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="text-center text-xs text-gray-500 mb-6"
            >
              {tabs.find((t) => t.id === activeTab)?.description}
            </motion.p>
          </AnimatePresence>

          {/* ── Error banner ──────────────────────────────────────────────── */}
          {activeTab === "paraphraser" && (
            <div className="min-h-[60px]">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6 p-4 bg-red-400/20 dark:bg-red-600/15 backdrop-blur-lg border-l-4 border-red-500/50 text-red-700 dark:text-red-300 rounded shadow-sm"
                >
                  <p>{error}</p>
                </motion.div>
              )}
            </div>
          )}

          {/* ── Tab content ───────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === "paraphraser" ? (
              <motion.div
                key="paraphraser"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
              >
                {/* ── NEON CARD ── */}
                <div className="neon-card">
                  <div className="neon-card-inner">

                    {/* Card header */}
                    <div className="px-6 pt-5 pb-4 flex items-center justify-between">
                      <span className="neon-badge"><Shuffle size={11} />Paraphraser</span>
                      <span className="text-white/25 text-xs tracking-widest">AI · POWERED</span>
                    </div>

                    <div className="neon-divider" />

                    {/* Card body — all logic unchanged */}
                    <div className="p-6 sm:p-8">
                      <TextEditor
                        value={originalText}
                        onChange={setOriginalText}
                        disabled={isParaphrasing || isChecking}
                      />

                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <ToneSelector
                          selectedTone={selectedTone}
                          onChange={setSelectedTone}
                          disabled={isParaphrasing || isChecking}
                        />

                        <button
                          onClick={handleParaphrase}
                          disabled={isParaphrasing || isChecking || !originalText.trim()}
                          className="group relative w-full sm:w-auto flex items-center justify-center gap-2
                                     border-2 border-purple-500/70 rounded-full px-8 py-4
                                     transition-all duration-500 ease-out
                                     hover:border-cyan-400 hover:shadow-lg hover:shadow-purple-500/40
                                     hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm
                                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                     disabled:hover:border-purple-500/70 disabled:hover:shadow-none
                                     before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                                     before:via-white/5 before:to-transparent before:translate-x-[-100%]
                                     hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          {isParaphrasing ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span className="text-white font-medium tracking-wide text-sm relative z-10">Synthesizing...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-white font-medium tracking-wide text-sm transition-all duration-300 group-hover:text-cyan-100 relative z-10">Paraphrase Now</span>
                              <span className="relative z-10 w-3 h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                                <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60" style={{ animationDuration: "2s" }} />
                              </span>
                            </>
                          )}
                          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0 group-hover:border-cyan-400/30 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                        </button>
                      </div>

                      <div className="mt-10 min-h-[200px]" style={{ position: "relative", zIndex: 50, isolation: "auto", overflow: "visible" }}>
                        {(rewrittenText || isParaphrasing) && (
                          <ResultCard
                            originalText={originalText}
                            text={rewrittenText}
                            isLoading={isParaphrasing}
                            onUpdate={setRewrittenText}
                          />
                        )}
                      </div>

                      <div className="min-h-[180px]">
                        {(similarityScore !== null || isChecking) && (
                          <PlagiarismScore
                            score={similarityScore}
                            webScore={webScore}
                            webCheckMeta={webCheckMeta}
                            isChecking={isChecking}
                          />
                        )}
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="neon-divider" />
                    <div className="px-6 py-3 flex items-center justify-between">
                      <span className="text-white/20 text-xs tracking-wider">© 2026 NAYAN GHOSH</span>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                    </div>

                  </div>
                </div>
                {/* ── END NEON CARD ── */}

              </motion.div>
            ) : activeTab === "plagiarism" ? (
              <motion.div
                key="plagiarism"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
              >
                <PlagiarismChecker />
              </motion.div>
            ) : (
              <motion.div
                key="humanizer"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
              >
                <div className="neon-card">
                  <div className="neon-card-inner">
                    <div className="px-6 pt-5 pb-4 flex items-center justify-between">
                      <span className="neon-badge"><Sparkles size={11} />AI Humanizer</span>
                      <span className="text-white/25 text-xs tracking-widest">ADVANCED AI</span>
                    </div>
                    <div className="neon-divider" />
                    <div className="p-2 sm:p-4">
                      <HumanizerPanel />
                    </div>
                    <div className="neon-divider" />
                    <div className="px-6 py-3 flex items-center justify-between">
                      <span className="text-white/20 text-xs tracking-wider">© 2026 NAYAN GHOSH</span>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </GridGlowBackground>
  );
}
