'use client';

import React from 'react';

interface AIRobotMascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const AIRobotMascot: React.FC<AIRobotMascotProps> = ({ 
  size = 80, 
  className = '', 
  animated = true 
}) => {
  return (
    <div 
      className={`inline-block ${animated ? 'animate-bounce' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Robot Head - Main Circle */}
        <circle
          cx="50"
          cy="45"
          r="25"
          fill="url(#robotGradient)"
          stroke="#2563eb"
          strokeWidth="2"
        />
        
        {/* Robot Eyes */}
        <circle cx="42" cy="40" r="4" fill="#ffffff" />
        <circle cx="58" cy="40" r="4" fill="#ffffff" />
        <circle cx="42" cy="40" r="2" fill="#2563eb" />
        <circle cx="58" cy="40" r="2" fill="#2563eb" />
        
        {/* Robot Mouth */}
        <rect
          x="46"
          y="50"
          width="8"
          height="3"
          rx="1.5"
          fill="#2563eb"
        />
        
        {/* Robot Antenna */}
        <line
          x1="50"
          y1="20"
          x2="50"
          y2="15"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="50" cy="13" r="2" fill="#10b981" />
        
        {/* Robot Body */}
        <rect
          x="35"
          y="65"
          width="30"
          height="20"
          rx="5"
          fill="url(#bodyGradient)"
          stroke="#2563eb"
          strokeWidth="2"
        />
        
        {/* Robot Arms */}
        <rect
          x="25"
          y="68"
          width="8"
          height="3"
          rx="1.5"
          fill="#3b82f6"
        />
        <rect
          x="67"
          y="68"
          width="8"
          height="3"
          rx="1.5"
          fill="#3b82f6"
        />
        
        {/* Robot Hands */}
        <circle cx="22" cy="69.5" r="3" fill="#2563eb" />
        <circle cx="78" cy="69.5" r="3" fill="#2563eb" />
        
        {/* Robot Legs */}
        <rect
          x="42"
          y="85"
          width="4"
          height="8"
          rx="2"
          fill="#3b82f6"
        />
        <rect
          x="54"
          y="85"
          width="4"
          height="8"
          rx="2"
          fill="#3b82f6"
        />
        
        {/* Robot Feet */}
        <ellipse cx="44" cy="95" rx="4" ry="2" fill="#2563eb" />
        <ellipse cx="56" cy="95" rx="4" ry="2" fill="#2563eb" />
        
        {/* Decorative Elements */}
        <rect
          x="40"
          y="72"
          width="20"
          height="2"
          rx="1"
          fill="#10b981"
        />
        <circle cx="45" cy="78" r="1.5" fill="#10b981" />
        <circle cx="55" cy="78" r="1.5" fill="#10b981" />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>
        
        {/* Sparkle Effects */}
        {animated && (
          <>
            <circle cx="25" cy="30" r="1" fill="#fbbf24" opacity="0.8">
              <animate
                attributeName="opacity"
                values="0.8;0.2;0.8"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="75" cy="35" r="1" fill="#fbbf24" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.6;0.1;0.6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="30" cy="60" r="0.5" fill="#fbbf24" opacity="0.7">
              <animate
                attributeName="opacity"
                values="0.7;0.2;0.7"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
};

export default AIRobotMascot;
