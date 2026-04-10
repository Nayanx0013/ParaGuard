"use client";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TextEditor({ value, onChange, disabled }: TextEditorProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      <label htmlFor="original-text" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Original Text
      </label>
      <textarea
        id="original-text"
        className="w-full h-64 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 dark:text-white dark:placeholder-gray-600"
        placeholder="Paste your text here to paraphrase..."
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
