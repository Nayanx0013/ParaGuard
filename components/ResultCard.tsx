"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, CheckCircle2, Download, Eye, FileText, ChevronDown, Loader2 } from "lucide-react";
import TextDiffView from "./TextDiffView";
import { motion, AnimatePresence } from "framer-motion";
import Loader4 from "./ui/loader-4";

// GlowingShadow intentionally removed — neon card styling is handled by the
// parent (home.tsx) wrapper. ResultCard renders cleanly inside it.

interface ResultCardProps {
  originalText: string;
  text: string;
  isLoading: boolean;
  onUpdate?: (newText: string) => void;
}

function InteractiveText({ text, onUpdate }: { text: string, onUpdate?: (newText: string) => void }) {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [loadingSynonyms, setLoadingSynonyms] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Split by words but keep punctuation attached to word, or carefully preserve whitespace/punctuation.
  // A simpler Regex that splits by words but keeps non-word chars as separate tokens.
  const tokens = text.match(/\w+|\s+|[^\w\s]+/g) || [];

  const handleWordClick = async (index: number, word: string) => {
    if (!word.match(/\w+/)) return; // Only process actual words
    
    if (activeWordIndex === index) {
      setActiveWordIndex(null);
      return;
    }
    
    setActiveWordIndex(index);
    setLoadingSynonyms(true);
    setSynonyms([]);
    
    try {
      const sentenceContext = text.slice(Math.max(0, text.indexOf(word) - 30), Math.min(text.length, text.indexOf(word) + 30));
      const res = await fetch("/api/synonyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, context: sentenceContext }),
      });
      const data = await res.json();
      setSynonyms(data.synonyms || []);
    } catch {
      setSynonyms([]);
    } finally {
      setLoadingSynonyms(false);
    }
  };

  const handleReplace = (index: number, newWord: string) => {
    const newTokens = [...tokens];
    
    // Attempt to match the original word's capitalization
    const originalWord = newTokens[index];
    let finalStr = newWord;
    
    if (originalWord && originalWord[0] === originalWord[0].toUpperCase()) {
      if (originalWord === originalWord.toUpperCase()) {
        finalStr = finalStr.toUpperCase();
      } else {
        finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
      }
    }
    
    newTokens[index] = finalStr;
    const newText = newTokens.join('');
    setActiveWordIndex(null);
    if (onUpdate) {
      onUpdate(newText);
    }
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveWordIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative leading-relaxed">
      {tokens.map((token, i) => {
        const isWord = /\w+/.test(token);
        
        if (!isWord) {
          return <span key={i} className="whitespace-pre-wrap">{token}</span>;
        }

        const isActive = activeWordIndex === i;

        return (
          <span key={i} className="relative inline-block">
            <span
              onClick={() => handleWordClick(i, token)}
              className={`cursor-pointer transition-colors duration-200 border-b border-transparent hover:border-purple-400/50 hover:bg-purple-500/10 rounded-sm px-px ${isActive ? 'bg-purple-500/20 border-purple-400/50 text-purple-200' : ''}`}
            >
              {token}
            </span>
            
            {/* Contextual Synonym Dropdown */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  ref={popoverRef}
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-[9999] top-[calc(100%+4px)] left-1/2 -translate-x-1/2 min-w-[140px] bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden shadow-purple-500/10"
                >
                  <div className="p-2 border-b border-white/5 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-center bg-black/20">
                    Synonyms
                  </div>
                  
                  {loadingSynonyms ? (
                    <div className="p-4 flex justify-center items-center">
                      <Loader2 className="animate-spin text-purple-400" size={16} />
                    </div>
                  ) : synonyms.length > 0 ? (
                    <div className="flex flex-col max-h-48 overflow-y-auto py-1 custom-scrollbar">
                      {synonyms.map((syn, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleReplace(i, syn)}
                          className="px-3 py-2 text-sm text-left text-gray-200 hover:bg-white/10 hover:text-purple-300 transition-colors w-full focus:outline-none"
                        >
                          {syn}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-xs text-center text-gray-500">
                      No matches found
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </span>
        );
      })}
    </div>
  );
}

export default function ResultCard({ originalText, text, isLoading, onUpdate }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"clean" | "diff">("clean");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-80 border border-white/10 rounded-lg flex flex-col items-center justify-center bg-transparent overflow-hidden"
      >
        <Loader4 />
      </motion.div>
    );
  }

  if (!text) return null;

  // ── All handlers unchanged ──────────────────────────────────────────────

  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (format: "doc" | "txt") => {
    setExportOpen(false);

    let contentStr = "";
    if (format === "txt") {
      contentStr = `PARAPHRASED DOCUMENT\n\n${text}\n\n---\nGenerated by ParaphraseAI`;
    } else {
      contentStr = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:w="urn:schemas-microsoft-com:office:word"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name=ProgId content=Word.Document>
          <title>Paraphrased Document</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12pt; margin: 1in; }
            p { line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>Paraphrased Document</h1>
          <p>${text.replace(/\n/g, "</p><p>")}</p>
          <p style="color:#888;font-size:10pt;">— Generated by ParaphraseAI</p>
        </body>
        </html>
      `.trim();
    }

    try {
      const formData = new FormData();
      formData.append("content", contentStr);
      formData.append("format", format);

      const response = await fetch("/api/export", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Paraphrased_Result.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
      className="w-full flex flex-col gap-0 relative z-30 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
    >
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4
                      p-4 border-b border-white/10 relative z-50">
        <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Paraphrased Result
        </h3>
        <div className="flex flex-wrap gap-2 relative z-50">

          {/* View mode toggle */}
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setViewMode("clean")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1
                ${viewMode === "clean"
                  ? "bg-white/10 text-blue-400 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-300"}`}
            >
              <FileText size={14} /> Clean
            </button>
            <button
              onClick={() => setViewMode("diff")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1
                ${viewMode === "diff"
                  ? "bg-white/10 text-purple-400 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-300"}`}
            >
              <Eye size={14} /> View Changes
            </button>
          </div>

          {/* Export dropdown */}
          <div className="relative z-[999]" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                         text-gray-400 hover:text-white
                         bg-white/5 hover:bg-white/10 rounded-lg transition-all
                         border border-white/10 hover:border-white/20"
            >
              <Download size={16} /> Export <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {exportOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-[calc(100%+8px)] w-36 bg-gray-900 rounded-lg shadow-xl border border-white/10 overflow-hidden z-[99999]"
                >
                  <div className="flex flex-col py-1">
                    <button
                      onClick={() => handleDownload("doc")}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 transition cursor-pointer"
                    >
                      Word (.doc)
                    </button>
                    <button
                      onClick={() => handleDownload("txt")}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 transition cursor-pointer"
                    >
                      Text (.txt)
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white
                       bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          {viewMode === "clean" ? (
            <motion.div
              key="clean"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="w-full min-h-[16rem] p-6 text-gray-200 whitespace-pre-wrap leading-relaxed text-lg"
            >
              <InteractiveText text={text} onUpdate={onUpdate} />
              <div className="mt-4 pt-3 border-t border-white/5 text-xs text-purple-400/60 font-medium flex items-center justify-end">
                <span className="inline-block w-2 h-2 rounded bg-purple-500/50 mr-2 animate-pulse"></span>
                Click any word to swap synonyms
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="diff"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="p-6 text-lg"
            >
              <TextDiffView originalText={originalText} rewrittenText={text} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}