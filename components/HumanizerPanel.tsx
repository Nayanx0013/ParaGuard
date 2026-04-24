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
  combinedScore: number;
  passesUsed: number;
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
          className="group relative px-12 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-full 
                     font-black text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] 
                     hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-3 relative z-10">
            {loading ? <RefreshCcw className="animate-spin" size={20} /> : <Zap size={20} className="group-hover:animate-pulse" />}
            {loading ? "PROCESSING PIPELINE..." : "HUMANIZE TEXT NOW"}
          </span>
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Phrase Risk", val: result.phraseScore, rev: true },
                { label: "Burstiness", val: result.originalScore, rev: false },
                { label: "Perplexity", val: result.perplexityScore, rev: false },
                { label: "Human Likelihood", val: result.combinedScore, rev: false },
              ].map((stat, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3 backdrop-blur-sm">
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{stat.label}</div>
                  <div className="flex items-end justify-between gap-2">
                    <span className={`text-2xl font-black ${stat.rev ? (stat.val > 60 ? 'text-red-400' : 'text-green-400') : getProgressBarColor(stat.val)}`}>
                      {stat.val}%
                    </span>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.val}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${getScoreColor(stat.val)}`}
                      />
                    </div>
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