"use client";

import React, { useState, useEffect } from "react";
import TextDiffView from "./TextDiffView";
import { Copy, Check, ShieldAlert, ShieldCheck, Shield } from "lucide-react";

export default function HumanizerPanel() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [corpusStatus, setCorpusStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
     fetch('/api/corpus-status').then(res => res.json()).then(data => {
         if (data.isLoaded) setCorpusStatus(data);
     }).catch(e => console.error(e));
  }, []);

  const handleHumanize = async () => {
    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (result?.humanizedText) {
      navigator.clipboard.writeText(result.humanizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score > 70) return <div className="flex items-center gap-1.5 text-green-300 bg-green-900/30 border border-green-500/30 px-2.5 py-1 rounded-md text-sm font-semibold shadow-[0_0_10px_rgba(34,197,94,0.2)]"><ShieldCheck className="w-4 h-4" /> LOW RISK</div>;
    if (score > 40) return <div className="flex items-center gap-1.5 text-yellow-300 bg-yellow-900/30 border border-yellow-500/30 px-2.5 py-1 rounded-md text-sm font-semibold shadow-[0_0_10px_rgba(234,179,8,0.2)]"><Shield className="w-4 h-4" /> MEDIUM RISK</div>;
    return <div className="flex items-center gap-1.5 text-red-300 bg-red-900/30 border border-red-500/30 px-2.5 py-1 rounded-md text-sm font-semibold shadow-[0_0_10px_rgba(239,68,68,0.2)]"><ShieldAlert className="w-4 h-4" /> HIGH RISK</div>;
  };

  const getProgressColor = (score: number) => {
    if (score > 70) return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
    if (score > 40) return "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]";
    return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
  };

  return (
    <div className="p-2 sm:p-4 space-y-6 text-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">ParaGuard AI Humanizer</h2>
        {result && getRiskBadge(result.finalScore || 0)}
      </div>
      
      {corpusStatus && (
          <div className="text-xs bg-blue-900/30 border border-blue-500/30 text-blue-300 p-2 rounded-md inline-block font-medium">
              Calibrated against {corpusStatus.documentsAnalyzed} human papers
          </div>
      )}

      <textarea
        className="w-full h-48 p-4 border border-white/10 rounded-xl bg-black/20 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500/70"
        placeholder="Paste your AI text here (min 100 words recommended)..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleHumanize}
        disabled={loading || !text}
        className="w-full sm:w-auto px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Humanizing (may take a moment)..." : "Humanize Text"}
      </button>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-sm text-gray-400 mb-1">Phrase Score</div>
                  <div className="text-2xl font-bold mb-2 text-white">{Math.round(result.phraseScore || 0)}/100</div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${getProgressColor(100 - (result.phraseScore || 0))} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, 100 - (result.phraseScore || 0)))}%` }} />
                  </div>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-sm text-gray-400 mb-1">Burstiness</div>
                  <div className="text-2xl font-bold mb-2 text-white">{Math.round(result.finalScore || 0)}/100</div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${getProgressColor(result.finalScore)} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, result.finalScore))}%` }} />
                  </div>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-sm text-gray-400 mb-1">Perplexity</div>
                  <div className="text-2xl font-bold mb-2 text-white">{result.perplexityScore ? Math.round(result.perplexityScore) + '/100' : 'N/A'}</div>
                  {result.perplexityScore && (
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${getProgressColor(result.perplexityScore)} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, result.perplexityScore))}%` }} />
                    </div>
                  )}
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-cyan-500/5" />
                  <div className="relative">
                    <div className="text-sm text-gray-400 mb-1">Combined Score</div>
                    <div className="text-2xl font-bold mb-2 text-green-400">{Math.round(result.combinedScore || result.finalScore || 0)}/100</div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${getProgressColor(result.combinedScore || result.finalScore)} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, result.combinedScore || result.finalScore))}%` }} />
                    </div>
                  </div>
              </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center text-sm font-medium">
             <div className="bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-md">Passes used: {result.passesUsed}</div>
             <div className="bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-md">Verdict: {result.verdict}</div>
          </div>

          {result.weaknesses && result.weaknesses.length > 0 && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
              <h3 className="font-semibold text-red-300 mb-2">Original Weaknesses Detected:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-400/90">
                {result.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-white">Text Diff (Changes Highlighted)</h3>
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors text-white">
                  {copied ? <><Check className="w-4 h-4 text-green-400" /> Copied</> : <><Copy className="w-4 h-4 text-cyan-400" /> Copy Humanized Text</>}
                </button>
             </div>
             
             <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                <TextDiffView originalText={text} rewrittenText={result.humanizedText} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}