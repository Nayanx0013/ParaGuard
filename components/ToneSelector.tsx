"use client";

export const TONES = ["Formal", "Casual", "Academic", "Creative", "Shorten", "Expand"];

interface ToneSelectorProps {
  selectedTone: string;
  onChange: (tone: string) => void;
  disabled?: boolean;
}

export default function ToneSelector({ selectedTone, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {TONES.map((tone) => (
        <button
          key={tone}
          onClick={() => onChange(tone)}
          disabled={disabled}
          className={`group relative flex items-center gap-2 border-2 rounded-full px-4 py-2 text-sm font-medium
                      transition-all duration-500 ease-out overflow-hidden backdrop-blur-sm
                      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                      before:via-white/5 before:to-transparent before:translate-x-[-100%]
                      hover:before:translate-x-[100%] before:transition-transform before:duration-700
                      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}
                      ${selectedTone === tone
                        ? "border-cyan-400 shadow-lg shadow-purple-500/40 text-cyan-100"
                        : "border-purple-500/70 text-white hover:border-cyan-400 hover:shadow-lg hover:shadow-purple-500/40"
                      }`}
        >
          {/* Background glow */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                          transition-opacity duration-500
                          ${selectedTone === tone ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />

          {/* Text */}
          <span className="relative z-10 transition-all duration-300 group-hover:text-cyan-100">
            {tone}
          </span>

          {/* Animated dot — only on selected */}
          {selectedTone === tone && (
            <span className="relative z-10 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-purple-400/50">
              <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-60"
                style={{ animationDuration: "2s" }} />
            </span>
          )}

          {/* Outer glow ring */}
          <div className={`absolute inset-0 rounded-full border-2 border-cyan-400/0
                          transition-all duration-500
                          ${selectedTone === tone ? "border-cyan-400/30 opacity-100" : "opacity-0 group-hover:border-cyan-400/30 group-hover:opacity-100"}`} />
        </button>
      ))}
    </div>
  );
}