"use client";

import { motion } from "framer-motion";

export const Component = () => {
  return (
    <div className="flex flex-col items-center justify-center z-50 gap-8">
      {/* 3D Perspective Container */}
      <div style={{ perspective: 800 }}>
        <motion.div
          animate={{
            rotateX: [0, 180, 180, 0, 0],
            rotateY: [0, 0, 180, 180, 0],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1],
            repeat: Infinity,
            repeatDelay: 0.1,
          }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-28 h-28 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl backdrop-blur-sm shadow-[0_0_40px_rgba(99,102,241,0.2)]"
        >
          {/* Inner Glowing Cube */}
          <motion.div
            animate={{
              rotateZ: [0, 90, 180, 270, 360],
              scale: [1, 0.5, 1, 0.5, 1],
              opacity: [1, 0.5, 1, 0.5, 1]
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1],
              repeat: Infinity,
              repeatDelay: 0.1,
            }}
            className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.8)]"
          />
        </motion.div>
      </div>
    </div>
  );
};
