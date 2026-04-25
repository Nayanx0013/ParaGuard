"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ShieldAlert, ShieldCheck, RefreshCcw, Zap } from "lucide-react";

interface HumanizerResult {
  humanizedText: string;
  originalScore: number;
  phraseScore: number;
  finalScore: number;
  perplexityScore: number;
  gptzeroScore: number | null;
  combinedScore: number;
  passesUsed: number;
  markersRemoved: number;
  verdict: string;
  weaknesses?: string[];
}

/**
 * HumanizerPanel: A specialized interface for the AI Humanizer tool.
 */
export default function HumanizerPanel() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<HumanizerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    // BUG FIX: Clear previous result so stale humanizedText never shows.
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // BUG FIX: Ensure the key matches what route.ts destructures: { text }
        body: JSON.stringify({ text: inputText }),
      });

      // BUG FIX: Parse error responses properly instead of silently failing.
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown server error" }));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json() as HumanizerResult;

      // BUG FIX: Validate that humanizedText actually came back and is different.
      if (!data.humanizedText || typeof data.humanizedText !== "string") {
        throw new Error("The server returned an empty humanized text.");
      }

      setResult(data);
    } catch (err) {
      console.error("HumanizerPanel error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result?.humanizedText) return;
    navigator.clipboard.writeText(result.humanizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score < 40) return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
    if (score < 70) return "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]";
    return "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
  };

  const getProgressBarColor = (score: number) => {
    if (score < 40) return "text-red-500";
    if (score < 70) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="bg-transparent text-white space-y-8 max-w-4xl mx-auto">
      <div className="relative group">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste AI-generated content to humanize..."
          className="w-full h-64 p-8 bg-black/40 border border-white/10 rounded-3xl text-white placeholder-gray-500 
                     focus:outline-none focus:border-purple-500/50 transition-all resize-none leading-relaxed text-lg"
          disabled={loading}
        />
        <div className="absolute bottom-6 right-6 text-xs font-mono text-gray-500 uppercase tracking-widest">
          {inputText.split(/\s+/).filter(Boolean).length} words
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleHumanize}
          disabled={loading || !inputText.trim()}
          className="group relative w-full sm:w-auto flex items-center justify-center gap-2
                     border-2 border-purple-500/70 rounded-full px-12 py-4
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
          {loading ? (
            <>
              <RefreshCcw className="animate-spin text-white relative z-10" size={18} />
              <span className="text-white font-medium tracking-wide text-sm relative z-10">PROCESSING PIPELINE...</span>
            </>
          ) : (
            <>
              <Zap size={18} className="text-cyan-400 group-hover:text-purple-300 transition-colors duration-300 relative z-10 group-hover:animate-pulse" />
              <span className="text-white font-medium tracking-wide text-sm transition-all duration-300 group-hover:text-cyan-100 relative z-10">HUMANIZE TEXT NOW</span>
              <span className="relative z-10 w-3 h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60" style={{ animationDuration: "2s" }} />
              </span>
            </>
          )}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0 group-hover:border-cyan-400/30 transition-all duration-500 opacity-0 group-hover:opacity-100" />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-sm"
        >
          ⚠️ {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.humanizedText}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* ── Before / After AI Score (Step 6) ────────────────────── */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm space-y-4">
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">AI Detection Score — Before vs After</div>
              <div className="flex items-center gap-4">
                {/* Before */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>Before</span>
                    <span className="text-red-400 font-black">{result.phraseScore}% AI</span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.phraseScore}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] rounded-full"
                    />
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-indigo-400 font-black text-lg">→</div>

                {/* After */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>After</span>
                    <span className={`font-black ${result.combinedScore > 68 ? 'text-green-400' : result.combinedScore > 38 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {100 - result.combinedScore}% AI
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: `${result.phraseScore}%` }}
                      animate={{ width: `${100 - result.combinedScore}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                      className={`h-full rounded-full ${result.combinedScore > 68 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : result.combinedScore > 38 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Summary line */}
              <div className="text-center text-xs text-gray-400">
                AI risk reduced by{" "}
                <span className="text-green-400 font-black">
                  {Math.max(0, result.phraseScore - (100 - result.combinedScore))}%
                </span>
                {" "}— {result.markersRemoved > 0 && (
                  <span>{result.markersRemoved} AI phrase{result.markersRemoved !== 1 ? 's' : ''} eliminated · </span>
                )}
                {result.passesUsed} rewrite {result.passesUsed === 1 ? 'pass' : 'passes'}
              </div>
            </div>

            {/* ── Supporting Metric Cards ──────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Human Likelihood",    val: result.combinedScore,    rev: false },
                { label: "Perplexity",          val: result.perplexityScore,  rev: false },
                { label: "Burstiness (Before)", val: result.originalScore,    rev: false },
                { label: "Burstiness (After)",  val: result.finalScore,       rev: false },
              ].map((stat, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3 backdrop-blur-sm flex flex-col justify-between">
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{stat.label}</div>
                  <div className="flex items-end justify-between gap-2">
                    <span className={`text-2xl font-black ${stat.rev ? (stat.val > 60 ? 'text-red-400' : 'text-green-400') : getProgressBarColor(stat.val)}`}>
                      {stat.val}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.val}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${getScoreColor(stat.val)}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-6 rounded-3xl border-2 backdrop-blur-xl flex items-center gap-6 ${
              result.combinedScore > 70
                ? "bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                : "bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
            }`}>
              <div className="p-3 bg-white/5 rounded-2xl">
                {result.combinedScore > 70
                  ? <ShieldCheck className="text-green-400" size={32} />
                  : <ShieldAlert className="text-red-400" size={32} />
                }
              </div>
              <div className="space-y-1">
                <div className="text-lg font-black text-white uppercase tracking-tight">Verdict: {result.verdict}</div>
                <div className="text-xs text-gray-400 font-medium">
                  Refined through {result.passesUsed} humanization {result.passesUsed === 1 ? "pass" : "passes"}. Structural weaknesses addressed.
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-3 left-6 px-3 bg-[#0a0a0a] text-[11px] text-indigo-400 font-black uppercase tracking-widest z-10 border border-indigo-500/30 rounded-full">
                Humanized Content
              </div>
              <div className="w-full min-h-[20rem] p-8 bg-white/5 border border-indigo-500/20 rounded-[2.5rem] text-gray-200 text-lg leading-relaxed shadow-inner whitespace-pre-wrap">
                {result.humanizedText}
              </div>

              <div className="absolute top-6 right-6 flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-gray-400 hover:text-white group"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="group-hover:scale-110 transition-transform" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}