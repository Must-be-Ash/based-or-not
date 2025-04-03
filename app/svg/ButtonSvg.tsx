import React from "react";

type ButtonSvgProps = {
  width?: number;
  height?: number;
  isPressed?: boolean;
};

export default function ButtonSvg({
  width = 60,
  height = 60,
  isPressed = false,
}: ButtonSvgProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Button shadow */}
      <circle
        cx="30"
        cy={isPressed ? "30" : "33"}
        r="25"
        fill="#002299"
        opacity="0.7"
      />
      
      {/* Button body */}
      <circle
        cx="30"
        cy={isPressed ? "28" : "30"}
        r="25"
        fill="#0052FF"
        stroke="#0046DB"
        strokeWidth="2"
      />
      
      {/* Button shine */}
      <ellipse
        cx="25"
        cy={isPressed ? "23" : "25"}
        rx="12"
        ry="8"
        fill="white"
        opacity="0.3"
      />
      
      {/* Button text */}
      <text
        x="30"
        y={isPressed ? "32" : "34"}
        fontFamily="Arial"
        fontSize="12"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        PRESS
      </text>
    </svg>
  );
} 