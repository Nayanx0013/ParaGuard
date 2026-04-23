"use client";

import { useMemo } from "react";
import * as diff from "diff";

interface TextDiffViewProps {
  originalText: string;
  rewrittenText: string;
}

export default function TextDiffView({ originalText, rewrittenText }: TextDiffViewProps) {
  const diffResult = useMemo(() => {
    if (!originalText || !rewrittenText) return [];
    return diff.diffWords(originalText, rewrittenText);
  }, [originalText, rewrittenText]);

  return (
    <div className="w-full min-h-[16rem] p-4 bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg shadow-inner backdrop-blur-xl text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed transition-colors duration-300">
      {diffResult.map((part, index) => {
        if (part.added) {
          return (
            <span key={index} className="bg-green-400/30 dark:bg-green-500/20 text-green-800 dark:text-green-300 rounded px-1 transition-colors">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={index} className="bg-red-400/30 dark:bg-red-500/20 text-red-800 dark:text-red-300 line-through rounded px-1 opacity-70 transition-colors">
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
}
