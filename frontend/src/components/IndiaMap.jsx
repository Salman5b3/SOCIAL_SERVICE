import React from 'react';

// Simplified stylized India map silhouette with pulse nodes
export default function IndiaMap() {
  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto">
      <svg viewBox="0 0 400 460" className="w-full h-full">
        <defs>
          <linearGradient id="mapFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Stylized India silhouette */}
        <path
          d="M 130 50 L 170 40 L 210 50 L 260 60 L 295 95 L 320 120 L 335 150 L 340 185 L 325 215 L 310 245 L 290 270 L 270 295 L 245 320 L 225 350 L 210 385 L 195 410 L 180 425 L 165 415 L 155 390 L 145 360 L 135 330 L 130 300 L 125 270 L 110 245 L 95 215 L 85 185 L 90 155 L 100 125 L 115 95 Z"
          fill="url(#mapFill)"
          stroke="#334155"
          strokeWidth="1"
          opacity="0.85"
        />
        {/* Dotted overlay grid */}
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={100 + (i % 6) * 35} cy={80 + Math.floor(i / 6) * 55} r="1" fill="#475569" opacity="0.3" />
        ))}

        {/* Connection lines */}
        <line x1="150" y1="120" x2="230" y2="180" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
        <line x1="230" y1="180" x2="260" y2="300" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
        <line x1="260" y1="300" x2="200" y2="380" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />

        {/* Glowing nodes */}
        <circle cx="150" cy="120" r="5" fill="#3b82f6" filter="url(#glow)">
          <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="230" cy="180" r="5" fill="#10b981" filter="url(#glow)">
          <animate attributeName="r" values="4;7;4" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="260" cy="300" r="5" fill="#f59e0b" filter="url(#glow)">
          <animate attributeName="r" values="4;7;4" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="380" r="5" fill="#3b82f6" filter="url(#glow)">
          <animate attributeName="r" values="4;7;4" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Floating stat cards */}
      <div className="absolute top-4 left-2 px-3 py-2 rounded-lg bg-[#0f172a]/90 border border-white/10 backdrop-blur-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-white text-sm font-medium">4</span>
        <div className="w-12 h-1 bg-blue-500/40 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-blue-500" />
        </div>
      </div>
      <div className="absolute top-2 right-0 px-3 py-2 rounded-lg bg-[#0f172a]/90 border border-white/10 backdrop-blur-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-white text-sm font-medium">4</span>
        <div className="w-12 h-1 bg-emerald-500/40 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-emerald-500" />
        </div>
      </div>
      <div className="absolute bottom-10 left-6 px-3 py-2 rounded-lg bg-[#0f172a]/90 border border-white/10 backdrop-blur-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-white text-sm font-medium">5010</span>
      </div>
      <div className="absolute bottom-4 right-2 px-3 py-2 rounded-lg bg-[#0f172a]/90 border border-white/10 backdrop-blur-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-white text-sm font-medium">Nodes</span>
        <div className="w-12 h-1 bg-blue-500/40 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-blue-500" />
        </div>
      </div>
    </div>
  );
}
