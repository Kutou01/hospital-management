'use client';

import React from 'react';
import Image from 'next/image';

interface AIIconProps {
  size?: number;
  className?: string;
  showText?: boolean;
  useCustomImage?: boolean;
  customImagePath?: string;
}

const AIIcon: React.FC<AIIconProps> = ({
  size = 32,
  className = '',
  showText = true,
  useCustomImage = false,
  customImagePath = '/images/ai-icon.png'
}) => {

  // Nếu sử dụng hình custom - bo tròn hoàn toàn
  if (useCustomImage) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        {/* Custom AI Image - Bo tròn hoàn toàn */}
        <div
          className="relative overflow-hidden rounded-full"
          style={{ width: size, height: size }}
        >
          <Image
            src={customImagePath}
            alt="AI Assistant"
            width={size * 1.5}
            height={size * 1.5}
            className="object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              objectPosition: 'center center',
            }}
          />
        </div>

        {/* AI Text */}
        {showText && (
          <div className="mt-1 text-center">
            <div
              className="font-bold text-white leading-tight"
              style={{ fontSize: size * 0.2 }}
            >
              AI Hỗ Trợ
            </div>
          </div>
        )}
      </div>
    );
  }

  // Hình AI mặc định (code cũ)
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* AI Robot Icon */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Main AI Head */}
        <div
          className="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-lg shadow-lg relative"
          style={{
            width: size * 0.8,
            height: size * 0.8,
            transform: 'rotate(45deg)'
          }}
        >
          {/* Inner AI Core */}
          <div
            className="absolute inset-2 bg-white rounded-md flex items-center justify-center"
            style={{ transform: 'rotate(-45deg)' }}
          >
            {/* AI Eyes */}
            <div className="flex space-x-1">
              <div
                className="bg-blue-500 rounded-full animate-pulse"
                style={{
                  width: size * 0.08,
                  height: size * 0.08
                }}
              ></div>
              <div
                className="bg-purple-500 rounded-full animate-pulse"
                style={{
                  width: size * 0.08,
                  height: size * 0.08,
                  animationDelay: '0.5s'
                }}
              ></div>
            </div>
          </div>

          {/* AI Antenna */}
          <div
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0.5 bg-gradient-to-t from-purple-500 to-pink-400"
            style={{
              height: size * 0.15,
              transform: 'translateX(-50%) rotate(-45deg)'
            }}
          >
            <div
              className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 bg-pink-400 rounded-full"
              style={{
                width: size * 0.06,
                height: size * 0.06
              }}
            ></div>
          </div>
        </div>

        {/* Glow Effect */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20 rounded-lg animate-pulse"
          style={{
            width: size,
            height: size,
            filter: 'blur(4px)'
          }}
        ></div>
      </div>

      {/* AI Text */}
      {showText && (
        <div className="mt-1 text-center">
          <div
            className="font-bold text-white leading-tight"
            style={{ fontSize: size * 0.2 }}
          >
            AI Hỗ Trợ
          </div>
        </div>
      )}
    </div>
  );
};

export default AIIcon;
