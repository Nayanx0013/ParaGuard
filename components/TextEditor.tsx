"use client";
import { useState } from "react";
import { FileUp, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TextEditor({ value, onChange, disabled }: TextEditorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isFixingGrammar, setIsFixingGrammar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to extract");
      }

      const data = await res.json();
      onChange(data.text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsExtracting(false);
      // Reset input so the same file can be uploaded again if needed
      e.target.value = "";
    }
  };

  const handleFixGrammar = async () => {
    if (!value || value.trim().length === 0) return;
    
    setIsFixingGrammar(true);
    setError(null);

    try {
      const res = await fetch("/api/grammar-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fix grammar");
      }

      const data = await res.json();
      onChange(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Grammar fix failed");
    } finally {
      setIsFixingGrammar(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor="original-text" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
          Original Text
        </label>
        
        <div className="flex items-center gap-3">
          {/* Fix Grammar Button */}
          <motion.button
            type="button"
            whileHover={{ scale: disabled || isFixingGrammar || !value ? 1 : 1.05 }}
            whileTap={{ scale: disabled || isFixingGrammar || !value ? 1 : 0.95 }}
            onClick={handleFixGrammar}
            disabled={disabled || isFixingGrammar || !value || isExtracting}
            className={`relative group flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-300 overflow-hidden
              ${disabled || isFixingGrammar || !value || isExtracting
                ? "bg-gray-100 dark:bg-zinc-800/50 text-gray-400 border-gray-200 dark:border-zinc-700 cursor-not-allowed" 
                : "bg-purple-500/10 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] hover:bg-purple-500/20 hover:border-purple-400 cursor-pointer"
              }`}
          >
            {!disabled && !isFixingGrammar && !!value && !isExtracting && (
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isFixingGrammar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {isFixingGrammar ? "Fixing..." : "Fix Grammar"}
            </span>
          </motion.button>

          {/* Upload File Button */}
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              disabled={disabled || isExtracting}
            />
            <motion.label
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              htmlFor="file-upload"
              className={`relative group flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-300 overflow-hidden cursor-pointer
                ${disabled || isExtracting 
                  ? "bg-gray-100 dark:bg-zinc-800/50 text-gray-400 border-gray-200 dark:border-zinc-700 cursor-not-allowed" 
                  : "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] hover:bg-cyan-500/20 hover:border-cyan-400"
                }`}
            >
              {!disabled && !isExtracting && (
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                {isExtracting ? "Extracting..." : "Upload File"}
              </span>
            </motion.label>
          </div>
        </div>
      </div>
      
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
      
      <textarea
        id="original-text"
        className="w-full h-64 p-4 border border-white/20 dark:border-white/10 rounded-lg shadow-sm bg-white/10 dark:bg-black/20 backdrop-blur-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/15 dark:focus:bg-black/30 resize-none text-gray-900 dark:text-white dark:placeholder-gray-500 placeholder-gray-600 transition-all"
        placeholder="Paste your text here or upload a PDF/DOCX file to extract its contents..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <div className="flex justify-end text-xs text-gray-500">
        {value.split(/\s+/).filter((word) => word.length > 0).length} words
      </div>
    </div>
  );
}
