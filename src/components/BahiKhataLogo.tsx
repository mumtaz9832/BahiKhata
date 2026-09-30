import React from 'react';

export interface BahiKhataLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const BahiKhataLogo: React.FC<BahiKhataLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className = '',
  showTagline = true,
}) => {
  // Dimension configurations
  const sizeConfig = {
    xs: { icon: 'w-6 h-6', text: 'text-sm', badge: 'text-[9px]', sub: 'text-[8px]' },
    sm: { icon: 'w-8 h-8', text: 'text-base', badge: 'text-[10px]', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-lg', badge: 'text-[11px]', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', badge: 'text-xs', sub: 'text-xs' },
    xl: { icon: 'w-24 h-24 sm:w-28 sm:h-28', text: 'text-3xl sm:text-4xl', badge: 'text-sm', sub: 'text-xs sm:text-sm' },
  }[size];

  // Official BahiKhata emblem SVG - Digital screen + Red hardcover ledger + Golden Rupee + 3D Golden Growth Swoosh
  const renderEmblem = () => (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeConfig.icon}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bkRedCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E61E2A" />
            <stop offset="60%" stopColor="#B30E16" />
            <stop offset="100%" stopColor="#800A10" />
          </linearGradient>
          <linearGradient id="bkGoldArrow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
          <linearGradient id="bkScreenBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <filter id="bkShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Digital Billing Tablet / Screen Background */}
        <rect
          x="16"
          y="10"
          width="54"
          height="42"
          rx="6"
          fill="url(#bkScreenBlue)"
          filter="url(#bkShadow)"
        />
        <rect x="22" y="14" width="42" height="3" rx="1.5" fill="#38BDF8" opacity="0.6" />
        <rect x="22" y="21" width="30" height="2" rx="1" fill="#E2E8F0" opacity="0.4" />
        <rect x="22" y="26" width="36" height="2" rx="1" fill="#E2E8F0" opacity="0.3" />

        {/* Hardcover Crimson Red Bahi Khata Ledger */}
        <g filter="url(#bkShadow)">
          {/* Back book page shadow & edge */}
          <path
            d="M 38 22 L 80 22 C 82 22 84 24 84 26 L 82 66 C 82 68 80 70 78 70 L 36 70 Z"
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth="0.8"
          />
          {/* Inner ledger page lines & mini bar chart */}
          <line x1="52" y1="28" x2="76" y2="28" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
          <line x1="52" y1="33" x2="74" y2="33" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
          <line x1="52" y1="38" x2="76" y2="38" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
          {/* Mini chart bars on page */}
          <rect x="54" y="47" width="3.5" height="12" rx="1" fill="#0284C7" />
          <rect x="60" y="43" width="3.5" height="16" rx="1" fill="#10B981" />
          <rect x="66" y="40" width="3.5" height="19" rx="1" fill="#F59E0B" />
          <rect x="72" y="49" width="3.5" height="10" rx="1" fill="#E11D48" />

          {/* Red Book Front Cover tilted */}
          <path
            d="M 22 28 C 22 26 24 24 27 24 L 46 20 C 49 19 51 21 51 24 L 48 76 C 48 79 46 81 43 81 L 24 85 C 22 85 20 83 20 80 Z"
            fill="url(#bkRedCover)"
            stroke="#991B1B"
            strokeWidth="0.8"
          />
          {/* Book Spine Stitch & Gold Embossed Rupee Sign */}
          <path d="M 23 28 L 21 82" stroke="#FBBF24" strokeWidth="1.2" strokeDasharray="2,2" opacity="0.7" />
          {/* Golden Rupee symbol on leather cover */}
          <text
            x="34"
            y="54"
            fill="#FDE68A"
            fontSize="18"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
            filter="url(#bkShadow)"
          >
            ₹
          </text>
        </g>

        {/* Sweeping 3D Golden Growth Arrow swoosh around book */}
        <path
          d="M 12 50 C 8 68 28 84 56 80 C 72 78 84 66 90 48"
          fill="none"
          stroke="url(#bkGoldArrow)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#bkShadow)"
        />
        {/* Arrow head pointing up-right */}
        <polygon
          points="90,44 95,30 82,37"
          fill="#F59E0B"
          filter="url(#bkShadow)"
        />
      </svg>
    </div>
  );

  // A. ICON VARIANT (For PWA icon, mobile header, collapsed desktop sidebar)
  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        {renderEmblem()}
      </div>
    );
  }

  // B. COMPACT VARIANT (For Header, Desktop Sidebar top, Mobile header)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        {renderEmblem()}
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight">
            <span className={`font-black text-slate-900 ${sizeConfig.text}`}>
              Bahi
            </span>
            <span className={`font-black text-rose-600 ${sizeConfig.text}`}>
              Khata
            </span>
          </div>
          {showTagline && (
            <span className={`font-bold tracking-wider text-amber-600 uppercase mt-0.5 ${sizeConfig.badge}`}>
              Smart Billing • Khata
            </span>
          )}
        </div>
      </div>
    );
  }

  // C. FULL HERO / ONBOARDING / LOGIN VARIANT
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Prominent Logo Asset */}
      <div className="relative mb-3 flex items-center justify-center">
        {renderEmblem()}
      </div>

      {/* Main Brand Typography */}
      <div className="flex items-center justify-center tracking-tight leading-none">
        <span className={`font-black text-slate-900 ${sizeConfig.text}`}>
          Bahi
        </span>
        <span className={`font-black text-rose-600 ${sizeConfig.text}`}>
          Khata
        </span>
      </div>

      {/* Subtitle / Marketing Tagline */}
      {showTagline && (
        <p className={`font-bold text-slate-600 tracking-wide mt-1.5 ${sizeConfig.sub}`}>
          Smart Billing • Digital Khata • Business Management
        </p>
      )}
    </div>
  );
};
