'use client';

import React from 'react';

interface AIRobotIconProps {
  size?: number;
  className?: string;
}

const AIRobotIcon: React.FC<AIRobotIconProps> = ({ size = 24, className = '' }) => {
  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Robot Head - Rounded Rectangle */}
        <rect
          x="8"
          y="6"
          width="16"
          height="14"
          rx="8"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.95"
        />

        {/* Robot Eyes - Cute and big */}
        <circle cx="13" cy="13" r="2.5" fill="#3b82f6" />
        <circle cx="19" cy="13" r="2.5" fill="#3b82f6" />
        <circle cx="13" cy="12.5" r="1" fill="white" />
        <circle cx="19" cy="12.5" r="1" fill="white" />

        {/* Robot Mouth - Happy smile */}
        <path
          d="M 13 16 Q 16 18 19 16"
          stroke="#3b82f6"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Robot Antenna with signal */}
        <line
          x1="16"
          y1="6"
          x2="16"
          y2="3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="2" r="1.5" fill="#10b981" />

        {/* Signal waves */}
        <path
          d="M 13 4 Q 16 2 19 4"
          stroke="#10b981"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />

        {/* Robot Body */}
        <rect
          x="10"
          y="20"
          width="12"
          height="8"
          rx="2"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Robot Arms */}
        <circle cx="6" cy="23" r="2" fill="white" stroke="currentColor" strokeWidth="1" />
        <circle cx="26" cy="23" r="2" fill="white" stroke="currentColor" strokeWidth="1" />
        <line x1="8" y1="22" x2="10" y2="22" stroke="currentColor" strokeWidth="1.5" />
        <line x1="22" y1="22" x2="24" y2="22" stroke="currentColor" strokeWidth="1.5" />

        {/* Robot Legs */}
        <rect x="13" y="28" width="2" height="3" rx="1" fill="currentColor" />
        <rect x="17" y="28" width="2" height="3" rx="1" fill="currentColor" />

        {/* Body decorations */}
        <rect x="14" y="22" width="4" height="1" rx="0.5" fill="#10b981" />
        <circle cx="14" cy="25" r="0.8" fill="#3b82f6" />
        <circle cx="18" cy="25" r="0.8" fill="#3b82f6" />
      </svg>
    </div>
  );
};

export default AIRobotIcon;
