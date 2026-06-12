"use client";

import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: "emerald" | "violet";
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  color = "emerald",
}: ScoreRingProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate score from 0 to target score on mount
    const timer = setTimeout(() => {
      setProgress(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine status color if default colors are needed
  const getStatusColor = () => {
    if (color === "emerald") {
      if (score >= 80) return "text-emerald-400";
      if (score >= 60) return "text-amber-400";
      return "text-rose-400";
    } else {
      if (score >= 80) return "text-violet-400";
      if (score >= 60) return "text-indigo-400";
      return "text-rose-400";
    }
  };

  const getGradientId = () => `ring-gradient-${color}-${score}`;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id={getGradientId()} x1="0%" y1="0%" x2="100%" y2="100%">
            {color === "emerald" ? (
              <>
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7c3aed" />
              </>
            )}
          </linearGradient>
        </defs>
        {/* Background Circle */}
        <circle
          className="text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated Progress Circle */}
        <circle
          stroke={`url(#${getGradientId()})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight text-white">
          {Math.round(progress)}%
        </span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${getStatusColor()}`}>
          {score >= 80 ? "Match" : score >= 60 ? "Average" : "Low"}
        </span>
      </div>
    </div>
  );
}
