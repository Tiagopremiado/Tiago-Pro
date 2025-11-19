import React from 'react';

interface Props {
  className?: string;
}

export const TiagoLogo: React.FC<Props> = ({ className = "w-12 h-12" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} drop-shadow-lg`}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" /> {/* Gold */}
          <stop offset="100%" stopColor="#10B981" /> {/* Emerald */}
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background Shield shape */}
      <path 
        d="M50 5 L90 25 L90 60 C90 80 50 95 50 95 C50 95 10 80 10 60 L10 25 L50 5 Z" 
        fill="#0f172a" 
        stroke="url(#logoGradient)" 
        strokeWidth="3"
      />

      {/* The 'T' and 'P' Monogram */}
      <g transform="translate(25, 25)">
        {/* T Vertical */}
        <rect x="20" y="5" width="10" height="45" rx="2" fill="url(#logoGradient)" />
        {/* T Horizontal */}
        <rect x="5" y="5" width="40" height="10" rx="2" fill="url(#logoGradient)" />
        
        {/* P Curve (implying the P connecting to T) */}
        <path 
          d="M30 15 H40 C55 15 55 35 40 35 H30" 
          stroke="url(#logoGradient)" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};