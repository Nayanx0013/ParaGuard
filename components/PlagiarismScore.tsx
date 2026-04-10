"use client";

import { AlertTriangle, CheckCircle2, Info, Globe, Type } from "lucide-react";
import { motion } from "framer-motion";
import RippleWaveLoader from "@/components/ui/ripple-wave-loader";
import { GlowingShadow } from "@/components/ui/glowing-shadow";

interface PlagiarismScoreProps {
  score: number | null; // Structural similarity
  webScore?: { score: number; low: number; high: number } | null; // Web plagiarism matched percentage + confidence band
  webCheckMeta?: {
    sampledSentenceCount: number;
    matchedSentenceCount: number;
    failedSentenceChecks: number;
    webProvidersUsed: string[];
    webProvidersFailed: string[];
    degradedWebCheck: boolean;
  } | null;
  isChecking: boolean;
}

// Dynamic risk badge styling based on web plagiarism score level.
function getRiskLevel(score: number) {
  if (score === 0)
    return {
      label: "Safe to Submit",
      color: "green",
      badge: "bg-green-400/10 dark:bg-green-500/5 border-green-300/50 dark:border-green-600/20",
      textColor: "text-green-700 dark:text-green-400",
      barColor: "bg-green-500",
      icon: CheckCircle2,
    };
  if (score <= 30)
    return {
      label: "Low Match Risk",
      color: "yellow",
      badge: "bg-yellow-400/10 dark:bg-yellow-500/5 border-yellow-300/50 dark:border-yellow-600/20",
      textColor: "text-yellow-700 dark:text-yellow-400",
      barColor: "bg-yellow-500",
      icon: Info,
    };
  if (score <= 60)
    return {
      label: "Moderate Match Risk",
      color: "orange",
      badge: "bg-orange-400/10 dark:bg-orange-500/5 border-orange-300/50 dark:border-orange-600/20",
      textColor: "text-orange-700 dark:text-orange-400",
      barColor: "bg-orange-500",
      icon: AlertTriangle,
    };
  return {
    label: "High Match Risk",
    color: "red",
    badge: "bg-red-400/10 dark:bg-red-500/5 border-red-300/50 dark:border-red-600/20",
    textColor: "text-red-700 dark:text-red-400",
    barColor: "bg-red-500",
    icon: AlertTriangle,
  };
}

// Contextual warning message based on score severity and match counts.
function getWarningMessage(
  score: number,
  matchedCount: number,
  sampledCount: number
): string {
  if (score === 0)
    return "No web matches found in sampled sentences. Safe to submit.";
  if (score <= 30)
    return `Low risk: ${matchedCount} of ${sampledCount} sampled sentences had partial web matches. Review before submitting.`;
  if (score <= 60)
    return `Moderate risk: ${matchedCount} of ${sampledCount} sampled sentences strongly matched web snippets. Rework flagged sentences before submitting.`;
  return `High risk: ${matchedCount} of ${sampledCount} sampled sentences strongly matched web search snippets. Significant rework required before submission.`;
}

export default function PlagiarismScore({ score, webScore, webCheckMeta, isChecking }: PlagiarismScoreProps) {
  if (isChecking) {
    return (
      <div className="w-full mt-6 p-4 border border-white/10 dark:border-white/5 rounded-lg bg-white/5 dark:bg-black/20 backdrop-blur-md flex flex-col items-center justify-center py-12 space-y-6">
        <RippleWaveLoader />
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">Scanning the live internet for exact matches...</p>
      </div>
    );
  }

  if (score === null) return null;

  const isStructureHighRisk = score > 60;
  
  // Web Plagiarism Risk
  const webScoreValue = webScore?.score ?? 0;
  const riskLevel = getRiskLevel(webScoreValue);
  const RiskIcon = riskLevel.icon;
  
  return (
    <GlowingShadow className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.2 }}
        className="mt-8 space-y-4"
      >
      {/* Structural Similarity Card */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.01 }}
        className={`p-4 border rounded-lg flex items-start gap-4 transition-all duration-300 shadow-sm ${
          isStructureHighRisk ? "bg-orange-400/10 dark:bg-orange-500/5 border-orange-300/50 dark:border-orange-600/20" : "bg-green-400/10 dark:bg-green-500/5 border-green-300/50 dark:border-green-600/20"
        }`}
      >
        <div className="mt-1">
          {isStructureHighRisk ? <Info className="text-orange-500" size={24} /> : <CheckCircle2 className="text-green-500" size={24} />}
        </div>
        <div className="flex-1">
          <h4 className={`font-bold flex items-center gap-2 ${isStructureHighRisk ? "text-orange-800 dark:text-orange-400" : "text-green-800 dark:text-green-400"}`}>
            <Type size={16} /> Structural Similarity: {score}%
          </h4>
          <p className={`text-sm mt-1 ${isStructureHighRisk ? "text-orange-700 dark:text-orange-300" : "text-green-700 dark:text-green-300"}`}>
            {isStructureHighRisk 
              ? "The structure has changed somewhat, but key patterns remain identical. Consider paraphrasing again."
              : "This text is structurally unique from your original input."}
          </p>
        </div>
      </motion.div>

      {/* Web Plagiarism Card */}
      {webScore !== null && webScore !== undefined && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.01 }}
          className={`p-4 border rounded-lg flex items-start gap-4 transition-all duration-300 shadow-sm ${riskLevel.badge}`}
        >
          <div className="mt-1">
            <RiskIcon className={`${riskLevel.color === "green" ? "text-green-500" : riskLevel.color === "yellow" ? "text-yellow-500" : riskLevel.color === "orange" ? "text-orange-500" : "text-red-500"} z-10`} size={24} />
          </div>
          <div className="flex-1">
            <h4 className={`font-bold flex items-center gap-2 ${riskLevel.textColor}`}>
              <Globe size={16} /> Live Internet Sample Check: {riskLevel.label}
            </h4>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${webScoreValue}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className={`h-2.5 rounded-full ${riskLevel.barColor}`} 
              />
            </div>
            <p className={`text-sm mt-2 font-medium ${riskLevel.textColor}`}>
              {webScoreValue === 0 
                ? "No strong matches found in sampled web search snippets. This is a signal, not a final plagiarism verdict."
                : `${getWarningMessage(webScoreValue, webCheckMeta?.matchedSentenceCount ?? 0, webCheckMeta?.sampledSentenceCount ?? 0)} Estimated range: ${webScore?.low ?? 0}% to ${webScore?.high ?? 0}%.`}
            </p>
            {webCheckMeta && webCheckMeta.sampledSentenceCount < 8 && (
              <p style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }} className={riskLevel.textColor}>
                Range widens with fewer sentences — paste longer text for a more precise estimate.
              </p>
            )}

            {webCheckMeta && webCheckMeta.sampledSentenceCount >= 8 && (
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  Sampled: {webCheckMeta.sampledSentenceCount} | Matched: {webCheckMeta.matchedSentenceCount} | Failed checks: {webCheckMeta.failedSentenceChecks}
                </p>
                <p>
                  Providers used: {webCheckMeta.webProvidersUsed.length > 0 ? webCheckMeta.webProvidersUsed.join(", ") : "none"}
                </p>
                {webCheckMeta.webProvidersFailed.length > 0 && (
                  <p>
                    Providers failed: {webCheckMeta.webProvidersFailed.join(", ")}
                  </p>
                )}
                {webCheckMeta.degradedWebCheck && (
                  <p className="text-amber-600 dark:text-amber-400">
                    Web check is degraded: one or more sentence searches failed across providers.
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
    </GlowingShadow>
  );
}

