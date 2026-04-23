"use client";

// Pyramid: Uiverse.io by andrew-demchenk0
// Text: Uiverse.io by dexter-st
export default function Loader4() {
  const text = "Generating";
  return (
    <div className="flex flex-col items-center">
      {/* Pyramid */}
      <div className="pyramid-loader">
        <div className="pyramid-wrapper">
          <span className="side side1"></span>
          <span className="side side2"></span>
          <span className="side side3"></span>
          <span className="side side4"></span>
          <span className="pyramid-shadow"></span>
        </div>
      </div>

      {/* Generating text */}
      <div className="gen-wrapper">
        <div className="gen-scanner"></div>
        {text.split("").map((letter, i) => (
          <span key={i} className="gen-letter" style={{ animationDelay: `${(i * 0.105 + 0.1).toFixed(3)}s` }}>
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
