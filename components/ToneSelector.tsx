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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
            selectedTone === tone
              ? "bg-blue-500/30 dark:bg-blue-600/40 text-blue-700 dark:text-blue-200 border-blue-400/50 dark:border-blue-500/50 shadow-md"
              : "bg-white/10 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {tone}
        </button>
      ))}
    </div>
  );
}
