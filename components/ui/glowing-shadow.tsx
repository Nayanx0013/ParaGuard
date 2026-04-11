"use client"

import { type ReactNode, useState, useRef, useEffect } from "react"

interface GlowingShadowProps {
  children: ReactNode
  className?: string
  intensity?: "normal" | "reduced"
}

export function GlowingShadow({ children, className = "", intensity = "normal" }: GlowingShadowProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePos({ x, y });
    };

    const handleMouseLeave = () => {
      setMousePos({ x: 50, y: 50 });
    };

    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener("mousemove", handleMouseMove);
      wrapper.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (wrapper) {
        wrapper.removeEventListener("mousemove", handleMouseMove);
        wrapper.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);
   
  return (
    <>
      <style jsx>{`
        @property --hue {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --rotate {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-x {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-translate-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-size {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-opacity {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-blur {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-scale {
          syntax: "<number>";
          inherits: true;
          initial-value: 2;
        }
        @property --glow-pos-x {
          syntax: "<number>";
          inherits: true;
          initial-value: 50;
        }
        @property --glow-pos-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 50;
        }

        .glow-wrapper {
          --card-color: hsl(260deg 100% 3%);
          --text-color: hsl(260deg 10% 55%);
          --card-radius: 16px;
          --border-width: 3px;
          --bg-size: 1;
          --hue: 0;
          --hue-speed: 1;
          --rotate: 0;
          --animation-speed: 4s;
          --interaction-speed: 0.55s;
          --glow-scale: 1.5;
          --scale-factor: 1;
          --glow-blur: 8;
          --glow-opacity: 0.5;
          --glow-radius: 100;
          --glow-rotate-unit: 1deg;

          position: relative;
          display: block;
          width: 100%;
        }

        .glow-wrapper:before,
        .glow-wrapper:after {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: var(--card-radius);
        }

        .glow-content {
          position: relative;
          background: transparent;
          border-radius: var(--card-radius);
          display: block;
          width: 100%;
        }

        .glow-content:before {
          content: "";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          border-radius: var(--card-radius);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          mix-blend-mode: normal;
          z-index: -1;
          background: hsl(0deg 0% 16%) radial-gradient(
            30% 30% at calc(var(--bg-x) * 1%) calc(var(--bg-y) * 1%),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 70%) calc(0% * var(--bg-size)),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 60%) calc(20% * var(--bg-size)),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 40%) calc(40% * var(--bg-size)),
            transparent 100%
          );
          animation: hue-animation var(--animation-speed) linear infinite,
                     rotate-bg var(--animation-speed) linear infinite;
          transition: --bg-size var(--interaction-speed) ease;
          pointer-events: none;
        }

        .glow {
          --glow-translate-y: 0;
          display: block;
          position: absolute;
          width: 100px;
          height: 100px;
          animation: none;
          transform: none;
          transform-origin: center;
          border-radius: 50%;
          pointer-events: none;
          top: calc(var(--glow-pos-y) * 1% - 50px);
          left: calc(var(--glow-pos-x) * 1% - 50px);
          z-index: 1;
          transition: top 0.08s ease-out, left 0.08s ease-out;
        }

        .glow:after {
          content: "";
          display: block;
          z-index: -2;
          filter: blur(calc(var(--glow-blur) * 10px));
          width: 130%;
          height: 130%;
          left: -15%;
          top: -15%;
          background: hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 60%);
          position: relative;
          border-radius: 50%;
          animation: hue-animation var(--animation-speed) linear infinite;
          opacity: 0.08;
        }

        .glow-wrapper[data-intensity="reduced"] .glow:after {
          opacity: 0.12;
        }

        .glow-wrapper:hover .glow-content {
          --text-color: white;
          box-shadow: 0 0 calc(var(--white-shadow) * 0.5vw) calc(var(--white-shadow) * 0.1vw) rgb(255 255 255 / 10%);
        }

        .glow-wrapper[data-intensity="reduced"]:hover .glow-content:after {
          opacity: 0.15;
        }

        .glow-wrapper:hover .glow-content:before {
          --bg-size: 4;
          animation-play-state: paused;
          transition: --bg-size var(--interaction-speed) ease;
        }

        .glow-wrapper:hover .glow {
          --glow-blur: 2;
          --glow-opacity: 0.3;
          animation-play-state: paused;
        }

        .glow-wrapper:hover .glow:after {
          opacity: 0.12;
        }

        @keyframes shadow-pulse {
          0%, 24%, 46%, 73%, 96% {
            --white-shadow: 0.5;
          }
          12%, 28%, 41%, 63%, 75%, 82%, 98% {
            --white-shadow: 2.5;
          }
          6%, 32%, 57% {
            --white-shadow: 1.3;
          }
          18%, 52%, 88% {
            --white-shadow: 3.5;
          }
        }

        @keyframes rotate-bg {
          0% {
            --bg-x: 0;
            --bg-y: 0;
          }
          25% {
            --bg-x: 100;
            --bg-y: 0;
          }
          50% {
            --bg-x: 100;
            --bg-y: 100;
          }
          75% {
            --bg-x: 0;
            --bg-y: 100;
          }
          100% {
            --bg-x: 0;
            --bg-y: 0;
          }
        }

        @keyframes rotate {
          from {
            --rotate: -70;
            --glow-translate-y: -65;
          }
          25% {
            --glow-translate-y: -65;
          }
          50% {
            --glow-translate-y: -65;
          }
          60%, 75% {
            --glow-translate-y: -65;
          }
          85% {
            --glow-translate-y: -65;
          }
          to {
            --rotate: calc(360 - 70);
            --glow-translate-y: -65;
          }
        }

        @keyframes hue-animation {
          0% {
            --hue: 0;
          }
          100% {
            --hue: 360;
          }
        }
      `}</style>

      <div 
        className={`glow-wrapper ${className}`} 
        ref={wrapperRef} 
        data-intensity={intensity}
        style={{ '--glow-pos-x': `${mousePos.x}`, '--glow-pos-y': `${mousePos.y}` } as React.CSSProperties}>
        <span className="glow"></span>
        <div className="glow-content">{children}</div>
      </div>
    </>
  )
}