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
    <div className="w-full min-h-[16rem] p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-inner text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed transition-colors duration-300">
      {diffResult.map((part, index) => {
        if (part.added) {
          return (
            <span key={index} className="bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200 rounded px-1 transition-colors">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={index} className="bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200 line-through rounded px-1 opacity-70 transition-colors">
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
}
