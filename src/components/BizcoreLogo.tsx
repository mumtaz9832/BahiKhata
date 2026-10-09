import React from 'react';

export interface BizcoreLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
  theme?: 'dark' | 'light' | 'auto';
}

export const BizcoreLogo: React.FC<BizcoreLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className = '',
  showTagline = true,
  theme = 'auto',
}) => {
  // Dimension configurations
  const sizeConfig = {
    xs: { icon: 'w-6 h-6', text: 'text-sm', badge: 'text-[9px]', sub: 'text-[8px]' },
    sm: { icon: 'w-8 h-8', text: 'text-base', badge: 'text-[10px]', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-lg', badge: 'text-[11px]', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', badge: 'text-xs', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20 sm:w-24 sm:h-24', text: 'text-3xl sm:text-4xl', badge: 'text-xs sm:text-sm', sub: 'text-xs sm:text-sm' },
  }[size];

  // Official BIZCORE SaaS Vector Emblem
  // Isometric core cube + dynamic business growth facets with enterprise indigo & cyan accents
  const renderEmblem = () => (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeConfig.icon}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm overflow-visible select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bizcoreGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id="bizcoreGradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="bizcoreGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="bizcoreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
          </linearGradient>
          <filter id="bizcoreShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Outer Hexagonal Core Shield */}
        <path
          d="M 50 8 L 86 28.5 L 86 71.5 L 50 92 L 14 71.5 L 14 28.5 Z"
          fill="url(#bizcoreGradDark)"
          stroke="#334155"
          strokeWidth="1.5"
          filter="url(#bizcoreShadow)"
        />

        {/* Left Core Facet - Dynamic B Pillar */}
        <path
          d="M 50 14 L 80 31.5 L 50 49 L 20 31.5 Z"
          fill="url(#bizcoreGradPrimary)"
          opacity="0.95"
        />

        {/* Bottom Left Core Facet */}
          <path
          d="M 20 36.5 L 48 52.5 L 48 85 L 20 68 Z"
          fill="url(#bizcoreGradAccent)"
          opacity="0.9"
        />

        {/* Bottom Right Core Facet with Upward Growth Dynamic */}
        <path
          d="M 52 52.5 L 80 36.5 L 80 68 L 52 85 Z"
          fill="#3B82F6"
          opacity="0.85"
        />

        {/* Inner Central Core Diamond Node (Smart Enterprise Focus) */}
        <polygon
          points="50,38 60,49 50,60 40,49"
          fill="#FFFFFF"
          filter="url(#bizcoreShadow)"
        />

        {/* Subtle high-tech core spark */}
        <circle cx="50" cy="49" r="2.5" fill="#06B6D4" />
      </svg>
    </div>
  );

  // A. ICON ONLY
  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        {renderEmblem()}
      </div>
    );
  }

  // Text color based on theme
  const bizColor =
    theme === 'dark' ? 'text-white' : 'text-slate-900 group-hover:text-slate-950';
  const coreColor = 'text-blue-600';

  // B. COMPACT VARIANT (Headers, Sidebar top, Cards)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        {renderEmblem()}
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight font-black">
            <span className={`${bizColor} ${sizeConfig.text}`}>BIZ</span>
            <span className={`${coreColor} ${sizeConfig.text}`}>CORE</span>
          </div>
          {showTagline && (
            <span className={`font-semibold tracking-wider text-slate-500 uppercase mt-0.5 ${sizeConfig.badge}`}>
              Complete Business Suite
            </span>
          )}
        </div>
      </div>
    );
  }

  // C. FULL HERO / LOGIN / ONBOARDING VARIANT
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Emblem */}
      <div className="relative mb-3 flex items-center justify-center">
        {renderEmblem()}
      </div>

      {/* Main Brand Typography */}
      <div className="flex items-center justify-center tracking-tight font-black leading-none">
        <span className={`${bizColor} ${sizeConfig.text}`}>BIZ</span>
        <span className={`${coreColor} ${sizeConfig.text}`}>CORE</span>
      </div>

      {/* Official Subtitle & Description */}
      {showTagline && (
        <div className="mt-2 space-y-1">
          <p className={`font-bold text-slate-700 tracking-tight ${sizeConfig.sub}`}>
            Complete Business Management Software
          </p>
          <p className="text-[10px] text-slate-500 font-medium tracking-wide hidden sm:block">
            Billing &bull; Inventory &bull; GST &bull; POS &bull; Accounting &bull; Business Analytics
          </p>
        </div>
      )}
    </div>
  );
};
