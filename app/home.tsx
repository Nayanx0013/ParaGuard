"use client";

import { useState } from "react";
import { Orbitron } from "next/font/google";
import TextEditor from "@/components/TextEditor";
import ToneSelector from "@/components/ToneSelector";
import ResultCard from "@/components/ResultCard";
import PlagiarismScore from "@/components/PlagiarismScore";
import { GridGlowBackground } from "@/components/ui/grid-glow-background";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
            {/* Orbitron title */}
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className={`${orbitron.className} text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400`}
            >
              AI Paraphraser & Plagiarism Checker
            </motion.h1>
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 font-light">
              Rewrite text instantly, perfectly control the tone, and analytically check for structural plagiarism risk.
            </p>
          </div>

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
                
                {/* Glowing Paraphrase Now button */}
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
                  {/* Background glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Text / Spinner */}
                  {isParaphrasing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-white font-medium tracking-wide text-sm relative z-10">Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white font-medium tracking-wide text-sm transition-all duration-300
                                       group-hover:text-cyan-100 relative z-10">
                        Paraphrase Now
                      </span>
                      {/* Animated dot */}
                      <span className="relative z-10 w-3 h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out
                                       group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                        <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60"
                          style={{ animationDuration: "2s" }} />
                      </span>
                    </>
                  )}

                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0
                                  group-hover:border-cyan-400/30 transition-all duration-500
                                  opacity-0 group-hover:opacity-100" />
                </button>
              </div>

              <div className="mt-10 min-h-[200px]">
                {(rewrittenText || isParaphrasing) && (
                  <ResultCard 
                    originalText={originalText}
                    text={rewrittenText} 
                    isLoading={isParaphrasing} 
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
          </div>
        </motion.div>
      </div>
    </GridGlowBackground>
  );
}