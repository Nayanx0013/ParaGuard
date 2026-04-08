"use client";

import { cn } from "@/lib/utils";

export const Component = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-10", className)}>
      <div className="flex flex-col items-center gap-10">
        
        {/* The Animated Ring */}
        <div className="loader ring-1 ring-white/10 dark:ring-white/5 bg-transparent rounded-full shadow-2xl relative"></div>
        
        {/* The Bouncing Letters */}
        <div className="flex items-center gap-[2px]">
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#471eec]">G</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#ad5fff]" style={{ animationDelay: "0.1s" }}>e</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#d60a47]" style={{ animationDelay: "0.2s" }}>n</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#471eec]" style={{ animationDelay: "0.3s" }}>e</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#ad5fff]" style={{ animationDelay: "0.4s" }}>r</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#d60a47]" style={{ animationDelay: "0.5s" }}>a</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#471eec]" style={{ animationDelay: "0.6s" }}>t</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#ad5fff]" style={{ animationDelay: "0.7s" }}>i</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#d60a47]" style={{ animationDelay: "0.8s" }}>n</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-[#471eec]" style={{ animationDelay: "0.9s" }}>g</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-white/50" style={{ animationDelay: "1.0s" }}>.</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-white/50" style={{ animationDelay: "1.1s" }}>.</span>
          <span className="loader-letter font-mono text-xl md:text-2xl font-bold tracking-widest text-white/50" style={{ animationDelay: "1.2s" }}>.</span>
        </div>
      </div>
    </div>
  );
};
