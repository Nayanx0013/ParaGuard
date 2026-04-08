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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            selectedTone === tone
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {tone}
        </button>
      ))}
    </div>
  );
}
