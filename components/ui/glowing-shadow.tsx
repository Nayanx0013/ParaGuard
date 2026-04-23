"use client"

import { type ReactNode } from "react"

interface GlowingShadowProps {
  children: ReactNode;
  className?: string;
}

export function GlowingShadow({ children, className = "" }: GlowingShadowProps) {
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
        @property --glow-radius {
          syntax: "<number>";
          inherits: true;
          initial-value: 2;
        }
        @property --white-shadow {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }

        .glow-container {
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
          --glow-blur: 6;
          --glow-opacity: 1;
          --glow-radius: 100;
          --glow-rotate-unit: 1deg;

          width: 100%;
          color: white;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          border-radius: var(--card-radius);
          /* FIXED: removed cursor: pointer so children get correct cursors */
          cursor: default;
          /* FIXED: pointer-events: auto on container but children handle their own */
          pointer-events: auto;
        }

        .glow-container:before,
        .glow-container:after {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: var(--card-radius);
          /* FIXED: pseudo-elements must not block clicks */
          pointer-events: none;
        }

        /*
         * glow-content: the wrapper that holds your actual card children.
         * Fully transparent background — no color here, so the glass/backdrop
         * styles on the children shine through completely undisturbed.
         * pointer-events: auto so all inputs, buttons, textareas work normally.
         */
        .glow-content {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: calc(var(--card-radius) * 0.9);
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          background: transparent;        /* fully transparent — no overlay */
          /* FIXED: children must receive all pointer events */
          pointer-events: auto;
        }

        /*
         * The spinning glowing bulb.
         * KEY FIX: pointer-events: none so it NEVER intercepts mouse events.
         * z-index: -1 keeps it visually BEHIND the card content.
         * overflow: hidden on the container clips it to the border area only.
         */
        .glow {
          --glow-translate-y: 0;
          display: block;
          position: absolute;
          width: 20%;
          height: 20%;
          /* FIXED: never intercept any pointer events */
          pointer-events: none;
          /* FIXED: sit behind the card content */
          z-index: -1;
          animation: rotate var(--animation-speed) linear infinite;
          transform: rotateZ(calc(var(--rotate) * var(--glow-rotate-unit)));
          transform-origin: center;
          border-radius: calc(var(--glow-radius) * 10vw);
        }

        /*
         * The actual coloured blur blob.
         * z-index: -1 keeps it behind everything.
         * pointer-events: none as well for safety.
         */
        .glow:after {
          content: "";
          display: block;
          z-index: -1;
          pointer-events: none;
          filter: blur(calc(var(--glow-blur) * 10px));
          width: 130%;
          height: 130%;
          left: -15%;
          top: -15%;
          background: hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 60%);
          position: relative;
          border-radius: calc(var(--glow-radius) * 10vw);
          animation: hue-animation var(--animation-speed) linear infinite;
          transform: scaleY(calc(var(--glow-scale) * var(--scale-factor) / 1.1))
                     scaleX(calc(var(--glow-scale) * var(--scale-factor) * 1.2))
                     translateY(calc(var(--glow-translate-y) * 1%));
          opacity: var(--glow-opacity);
        }

        /*
         * Hover state: subtle inner shadow only — does NOT affect background.
         * The glow blob pauses and tightens to the border edge.
         */
        .glow-container:hover .glow-content {
          box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.04);
        }

        .glow-container:hover .glow {
          --glow-blur: 1.5;
          --glow-opacity: 0.6;
          --glow-scale: 2.5;
          --glow-radius: 0;
          --rotate: 900;
          --glow-rotate-unit: 0;
          --scale-factor: 1.25;
          animation-play-state: paused;
        }

        .glow-container:hover .glow:after {
          --glow-translate-y: 0;
          animation-play-state: paused;
          transition:
            --glow-translate-y 0s ease,
            --glow-blur 0.05s ease,
            --glow-opacity 0.05s ease,
            --glow-scale 0.05s ease,
            --glow-radius 0.05s ease;
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

      <div className={`glow-container ${className}`}>
        {/* 
          .glow sits BEHIND everything (z-index: -1, pointer-events: none).
          It orbits around the border edge and never touches the card interior.
        */}
        <span className="glow"></span>

        {/* 
          .glow-content is fully transparent and passes all pointer events
          through to whatever card / input / button you render inside it.
        */}
        <div className="glow-content">{children}</div>
      </div>
    </>
  )
}