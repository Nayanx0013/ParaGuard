"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Trash2, ClipboardPaste,
  AlertTriangle, CheckCircle2, Info, Globe,
} from "lucide-react";
import RippleWaveLoader from "@/components/ui/ripple-wave-loader";

// ── Types ─────────────────────────────────────────────────────────────────────

type WebCheckMeta = {
  sampledSentenceCount: number;
  matchedSentenceCount: number;
  failedSentenceChecks: number;
  matchedUrls?: string[];
  webProvidersUsed: string[];
  webProvidersFailed: string[];
  degradedWebCheck: boolean;
};

type WebScoreBand = {
  score: number;
  low: number;
  high: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const WORD_LIMIT = 1000;

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function getRiskLevel(score: number) {
  if (score === 0)
    return {
      label: "Safe to Submit", color: "green",
      badge: "bg-green-400/10 dark:bg-green-500/5 border-green-300/50 dark:border-green-600/20",
      textColor: "text-green-700 dark:text-green-400",
      barColor: "bg-green-500", icon: CheckCircle2,
    };
  if (score <= 30)
    return {
      label: "Low Match Risk", color: "yellow",
      badge: "bg-yellow-400/10 dark:bg-yellow-500/5 border-yellow-300/50 dark:border-yellow-600/20",
      textColor: "text-yellow-700 dark:text-yellow-400",
      barColor: "bg-yellow-500", icon: Info,
    };
  if (score <= 60)
    return {
      label: "Moderate Match Risk", color: "orange",
      badge: "bg-orange-400/10 dark:bg-orange-500/5 border-orange-300/50 dark:border-orange-600/20",
      textColor: "text-orange-700 dark:text-orange-400",
      barColor: "bg-orange-500", icon: AlertTriangle,
    };
  return {
    label: "High Match Risk", color: "red",
    badge: "bg-red-400/10 dark:bg-red-500/5 border-red-300/50 dark:border-red-600/20",
    textColor: "text-red-700 dark:text-red-400",
    barColor: "bg-red-500", icon: AlertTriangle,
  };
}

// ── Neon card styles (same design tokens as home.tsx) ─────────────────────────
const NEON_STYLES = `
  .neon-card {
    position: relative;
    border-radius: 18px;
    background: transparent;
    padding: 1.5px;
    width: 100%;
  }
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
  .neon-card-inner {
    position: relative;
    z-index: 1;
    border-radius: 16px;
    background: rgba(8,8,16,0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    overflow: hidden;
    width: 100%;
  }
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

// ── WebOnlyPlagiarismResult — logic 100% unchanged ────────────────────────────

interface WebOnlyProps {
  webScore: WebScoreBand | null;
  webCheckMeta: WebCheckMeta | null;
  isChecking: boolean;
}

function WebOnlyPlagiarismResult({ webScore, webCheckMeta, isChecking }: WebOnlyProps) {
  if (isChecking) {
    return (
      <div className="w-full mt-6 p-4 border border-white/10 dark:border-white/5 rounded-lg bg-white/5 dark:bg-black/20 backdrop-blur-md flex flex-col items-center justify-center py-12 space-y-6">
        <RippleWaveLoader />
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
          Scanning the live internet for exact matches...
        </p>
      </div>
    );
  }

  if (!webScore) return null;

  const webScoreValue = webScore.score;
  const riskLevel = getRiskLevel(webScoreValue);
  const RiskIcon = riskLevel.icon;
  const matched = webCheckMeta?.matchedSentenceCount ?? 0;
  const sampled = webCheckMeta?.sampledSentenceCount ?? 0;

  const message =
    webScoreValue === 0
      ? "No strong matches found in sampled web search snippets. This is a signal, not a final plagiarism verdict."
      : webScoreValue <= 30
        ? `Low risk: ${matched} of ${sampled} sampled sentences had partial web matches. Review before submitting.`
        : webScoreValue <= 60
          ? `Moderate risk: ${matched} of ${sampled} sampled sentences strongly matched web snippets. Rework flagged sentences before submitting.`
          : `High risk: ${matched} of ${sampled} sampled sentences strongly matched web search snippets. Significant rework required.`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.01 }}
        className={`p-4 border rounded-lg flex items-start gap-4 transition-all duration-300 shadow-sm ${riskLevel.badge}`}
      >
        <div className="mt-1">
          <RiskIcon
            className={
              riskLevel.color === "green" ? "text-green-500" :
                riskLevel.color === "yellow" ? "text-yellow-500" :
                  riskLevel.color === "orange" ? "text-orange-500" :
                    "text-red-500"
            }
            size={24}
          />
        </div>
        <div className="flex-1">
          <h4 className={`font-bold flex items-center gap-2 ${riskLevel.textColor}`}>
            <Globe size={16} /> Live Internet Sample Check: {riskLevel.label}
          </h4>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${webScoreValue}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className={`h-2.5 rounded-full ${riskLevel.barColor}`}
            />
          </div>
          <p className={`text-sm mt-2 font-medium ${riskLevel.textColor}`}>
            {message}
            {webScoreValue > 0 && ` Estimated range: ${webScore.low}%\u2013${webScore.high}%.`}
          </p>
          {webCheckMeta && sampled < 8 && (
            <p style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }} className={riskLevel.textColor}>
              Range widens with fewer sentences — paste longer text for a more precise estimate.
            </p>
          )}

          {webCheckMeta && webCheckMeta.matchedUrls && webCheckMeta.matchedUrls.length > 0 && (
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div className="mt-2 space-y-1">
                <p className="font-semibold text-red-500 dark:text-red-400 flex items-center gap-1">
                  <Globe size={12} /> Source Links:
                </p>
                <ul className="list-disc pl-5">
                  {webCheckMeta.matchedUrls.map((url, i) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {webCheckMeta && sampled >= 8 && (
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>Sampled: {sampled} | Matched: {matched} | Failed checks: {webCheckMeta.failedSentenceChecks}</p>
              <p>Providers used: {webCheckMeta.webProvidersUsed.length > 0 ? webCheckMeta.webProvidersUsed.join(", ") : "none"}</p>
              {webCheckMeta.webProvidersFailed.length > 0 && <p>Providers failed: {webCheckMeta.webProvidersFailed.join(", ")}</p>}
              {webCheckMeta.degradedWebCheck && (
                <p className="text-amber-600 dark:text-amber-400">Web check is degraded: one or more sentence searches failed across providers.</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PlagiarismChecker() {
  const [inputText, setInputText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [webScore, setWebScore] = useState<WebScoreBand | null>(null);
  const [webCheckMeta, setWebCheckMeta] = useState<WebCheckMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const wordCount = countWords(inputText);
  const isOverLimit = wordCount > WORD_LIMIT;

  // ── All handlers unchanged ────────────────────────────────────────────────

  const handleCheck = async () => {
    if (!inputText.trim()) { setError("Please paste or type some text to check."); return; }
    if (isOverLimit) { setError(`Please reduce your text to under ${WORD_LIMIT} words.`); return; }
    setError(null);
    setIsChecking(true);
    setWebScore(null);
    setWebCheckMeta(null);
    setHasChecked(false);
    try {
      const response = await fetch("/api/plagiarism-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText: inputText, rewrittenText: inputText }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) throw new Error("Please log in first to run plagiarism checks.");
        throw new Error(data.error || "Plagiarism check failed.");
      }
      if (data.degradedWebCheck) setError("Web matching was partially unavailable. Results are best-effort sample indicators.");
      setWebScore(data.webPlagiarismScore);
      setWebCheckMeta({
        sampledSentenceCount: data.sampledSentenceCount ?? 0,
        matchedSentenceCount: data.matchedSentenceCount ?? 0,
        failedSentenceChecks: data.failedSentenceChecks ?? 0,
        webProvidersUsed: data.webProvidersUsed ?? [],
        webProvidersFailed: data.webProvidersFailed ?? [],
        degradedWebCheck: Boolean(data.degradedWebCheck),
      });
      setHasChecked(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred."));
    } finally {
      setIsChecking(false);
    }
  };

  const handleClear = () => {
    setInputText(""); setWebScore(null); setWebCheckMeta(null);
    setError(null); setHasChecked(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setHasChecked(false); setWebScore(null); setWebCheckMeta(null);
    } catch {
      setError("Could not read clipboard. Please paste manually.");
    }
  };

  return (
    <>
      <style>{NEON_STYLES}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="space-y-6"
      >
        {/* Error Banner — unchanged */}
        <div className="min-h-[52px]">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-4 bg-red-400/20 dark:bg-red-600/15 backdrop-blur-lg border-l-4 border-red-500/50 text-red-700 dark:text-red-300 rounded shadow-sm"
              >
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── NEON CARD ── */}
        <div className="neon-card">
          <div className="neon-card-inner">

            {/* Card header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between">
              <span className="neon-badge"><ShieldCheck size={11} />Plagiarism Checker</span>
              <div className="flex gap-2">
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200"
                >
                  <ClipboardPaste size={13} /> Paste
                </button>
                {inputText && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-400/40 rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={13} /> Clear
                  </motion.button>
                )}
              </div>
            </div>

            <div className="neon-divider" />

            {/* Card body — all logic unchanged */}
            <div className="p-6 sm:p-8 space-y-6">

              <div>
                <h2 className="text-lg font-bold text-white/90">Paste your text below</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  We&apos;ll sample sentences and cross-check them across the live web.
                </p>
              </div>

              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (hasChecked) { setHasChecked(false); setWebScore(null); setWebCheckMeta(null); }
                  }}
                  disabled={isChecking}
                  placeholder="Paste or type text here to check for plagiarism… (up to 1,000 words)"
                  rows={10}
                  className={`w-full resize-none bg-white/5 dark:bg-black/20 border rounded-xl p-4
                             text-gray-200 placeholder-gray-500 text-sm leading-relaxed
                             focus:outline-none focus:ring-2 transition-all duration-300
                             disabled:opacity-60 disabled:cursor-not-allowed
                             ${isOverLimit
                      ? "border-red-500/50 focus:ring-red-500/30"
                      : "border-white/10 focus:ring-purple-500/40 focus:border-purple-500/40"
                    }`}
                />
                <div className={`absolute bottom-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full
                                backdrop-blur-sm border transition-colors duration-200
                                ${isOverLimit
                    ? "text-red-400 bg-red-500/10 border-red-500/30"
                    : "text-gray-400 bg-black/20 border-white/10"
                  }`}>
                  {wordCount} / {WORD_LIMIT} words
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-cyan-500" />
                  Checks against live web results using multiple search providers
                </p>
                <button
                  onClick={handleCheck}
                  disabled={isChecking || !inputText.trim() || isOverLimit}
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
                  {isChecking ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-white font-medium tracking-wide text-sm relative z-10">Scanning...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-cyan-400 group-hover:text-purple-300 transition-colors duration-300 relative z-10" />
                      <span className="text-white font-medium tracking-wide text-sm transition-all duration-300 group-hover:text-cyan-100 relative z-10">Check Plagiarism</span>
                      <span className="relative z-10 w-3 h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                        <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60" style={{ animationDuration: "2s" }} />
                      </span>
                    </>
                  )}
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0 group-hover:border-cyan-400/30 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                </button>
              </div>

              <div className="min-h-[160px]">
                {(hasChecked || isChecking) && (
                  <WebOnlyPlagiarismResult
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
              <span className="text-white/20 text-xs tracking-wider">PARAGUARD AI</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            </div>

          </div>
        </div>
        {/* ── END NEON CARD ── */}

      </motion.div>
    </>
  );
}