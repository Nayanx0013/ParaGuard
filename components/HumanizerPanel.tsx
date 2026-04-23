"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TextDiffView from "./TextDiffView";
import { Copy, Check, ShieldAlert, ShieldCheck, Shield } from "lucide-react";

export default function HumanizerPanel() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
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
    if (score > 70) return <div className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded text-sm font-semibold"><ShieldCheck className="w-4 h-4" /> LOW RISK</div>;
    if (score > 40) return <div className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-sm font-semibold"><Shield className="w-4 h-4" /> MEDIUM RISK</div>;
    return <div className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded text-sm font-semibold"><ShieldAlert className="w-4 h-4" /> HIGH RISK</div>;
  };

  const getProgressColor = (score: number) => {
    if (score > 70) return "bg-green-500";
    if (score > 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ParaGuard AI Humanizer</h2>
        {result && getRiskBadge(result.finalScore || 0)}
      </div>
      
      {corpusStatus && (
          <div className="text-xs bg-blue-100 text-blue-800 p-2 rounded-md inline-block font-medium">
              Calibrated against {corpusStatus.documentsAnalyzed} human papers
          </div>
      )}

      <textarea
        className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="Paste your AI text here (min 100 words recommended)..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <Button onClick={handleHumanize} disabled={loading || !text} className="w-full sm:w-auto">
        {loading ? "Humanizing (may take a moment)..." : "Humanize Text"}
      </Button>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Phrase Score</div>
                  <div className="text-2xl font-bold mb-2">{Math.round(result.phraseScore || 0)}/100</div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${getProgressColor(100 - (result.phraseScore || 0))} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, 100 - (result.phraseScore || 0)))}%` }} />
                  </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Burstiness</div>
                  <div className="text-2xl font-bold mb-2">{Math.round(result.finalScore || 0)}/100</div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${getProgressColor(result.finalScore)} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, result.finalScore))}%` }} />
                  </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Perplexity</div>
                  <div className="text-2xl font-bold mb-2">{result.perplexityScore ? Math.round(result.perplexityScore) + '/100' : 'N/A'}</div>
                  {result.perplexityScore && (
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${getProgressColor(result.perplexityScore)} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, result.perplexityScore))}%` }} />
                    </div>
                  )}
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Combined Score</div>
                  <div className="text-2xl font-bold mb-2 text-green-600">{Math.round(result.combinedScore || result.finalScore || 0)}/100</div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${getProgressColor(result.combinedScore || result.finalScore)} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, result.combinedScore || result.finalScore))}%` }} />
                  </div>
              </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center text-sm font-medium">
             <div className="bg-secondary px-3 py-1 rounded-md">Passes used: {result.passesUsed}</div>
             <div className="bg-secondary px-3 py-1 rounded-md">Verdict: {result.verdict}</div>
          </div>

          {result.weaknesses && result.weaknesses.length > 0 && (
            <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Original Weaknesses Detected:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-700 dark:text-red-400">
                {result.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Text Diff (Changes Highlighted)</h3>
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-2">
                  {copied ? <><Check className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Humanized Text</>}
                </Button>
             </div>
             
             <TextDiffView originalText={text} rewrittenText={result.humanizedText} />
          </div>
        </div>
      )}
    </div>
  );
}