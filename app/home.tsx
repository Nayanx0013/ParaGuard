"use client";

import { useState } from "react";
import TextEditor from "@/components/TextEditor";
import ToneSelector from "@/components/ToneSelector";
import ResultCard from "@/components/ResultCard";
import PlagiarismScore from "@/components/PlagiarismScore";
import { GridGlowBackground } from "@/components/ui/grid-glow-background";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function HomePage() {
  const [originalText, setOriginalText] = useState("");
  const [selectedTone, setSelectedTone] = useState("Formal");
  const [rewrittenText, setRewrittenText] = useState("");
  
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [webScore, setWebScore] = useState<WebScoreBand | null>(null);
  const [webCheckMeta, setWebCheckMeta] = useState<WebCheckMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParaphrase = async () => {
    if (!originalText.trim()) {
      setError("Please enter some text to paraphrase.");
      return;
    }
    
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
        if (response.status === 401) {
          throw new Error("Please login first to use paraphrasing and plagiarism checks.");
        }
        throw new Error(data.error || "Failed to paraphrase text");
      }

      setRewrittenText(data.result);
      
      // Now run similarity check
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
        if (response.status === 401) {
          throw new Error("Please login first to run plagiarism checks.");
        }
        throw new Error(data.error || "Plagiarism check failed.");
      }

      if (data.degradedWebCheck) {
        setError("Web matching was partially unavailable. Results are best-effort sample indicators.");
      }
      
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

      // Save to Supabase History if logged in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: insertError } = await supabase.from("paraphrases").insert({
          user_id: user.id,
          original_text: original,
          paraphrased_text: rewritten,
          tone: tone,
          similarity_score: data.structuralSimilarityToOriginal,
          web_score: data.webPlagiarismScore?.score ?? 0,
        });
        
        if (insertError) {
          console.error("Failed to save history:", insertError.message);
        }
      }

    } catch (err: unknown) {
      console.error("Similarity check error:", err);
      setError(getErrorMessage(err, "Similarity check failed."));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <GridGlowBackground
      backgroundColor="#0a0a0a"
      gridColor="rgba(255, 255, 255, 0.05)"
      gridSize={50}
      glowColors={["#4A00E0", "#8E2DE2", "#4A00E0"]}
      glowCount={10}
    >
      <div className="min-h-screen w-full py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <div className="text-center mb-10">
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
            >
              AI Paraphraser & Plagiarism Checker
            </motion.h1>
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 font-light">
              Rewrite text instantly, perfectly control the tone, and analytically check for structural plagiarism risk.
            </p>
          </div>

          {/* Error message container with reserved height to prevent layout shift */}
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

          <div className="bg-white/10 dark:bg-black/30 backdrop-blur-2xl rounded-2xl shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 dark:border-white/10">
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
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white transform hover:-translate-y-1"
                >
                  {isParaphrasing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Synthesizing...
                    </>
                  ) : "Paraphrase Now"}
                </button>
              </div>

              {/* Results container with minimum height to prevent layout shift */}
              <div className="mt-10 min-h-[200px]">
                {(rewrittenText || isParaphrasing) && (
                  <ResultCard 
                    originalText={originalText}
                    text={rewrittenText} 
                    isLoading={isParaphrasing} 
                  />
                )}
              </div>

              {/* Plagiarism score container with minimum height */}
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
          </div>
        </motion.div>
      </div>
    </GridGlowBackground>
  );
}
