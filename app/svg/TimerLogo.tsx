import React from "react";

type TimerLogoProps = {
  width?: number;
  height?: number;
  animate?: boolean;
};

export default function TimerLogo({
  width = 300,
  height = 60,
  animate = false,
}: TimerLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 60"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradientBg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#002299" stopOpacity="1" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur
            stdDeviation={animate ? "4" : "2"}
            result="blur"
          />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g filter="url(#glow)">
        <text
          x="12"
          y="45"
          fontFamily="Arial"
          fontSize="40"
          fontWeight="bold"
          fill="url(#gradientBg)"
          className={animate ? "animate-pulse" : ""}
        >
          Timed Right        </text>
        
        {/* Timer Circle */}
        <circle
          cx="280"
          cy="30"
          r="15"
          fill="none"
          stroke="#0052FF"
          strokeWidth="2"
          className={animate ? "animate-spin" : ""}
        />
        
        {/* Timer Hands */}
        <line
          x1="280"
          y1="30"
          x2="280"
          y2="20"
          stroke="#0052FF"
          strokeWidth="2"
          className={animate ? "animate-spin" : ""}
        />
        <line
          x1="280"
          y1="30"
          x2="288"
          y2="30"
          stroke="#0052FF"
          strokeWidth="2"
          className={animate ? "animate-spin" : ""}
        />
      </g>
    </svg>
  );
} 