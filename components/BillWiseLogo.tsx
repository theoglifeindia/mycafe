import React from 'react';

interface BillWiseLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'dark' | 'light' | 'auto' | 'blue';
  showTagline?: boolean;
  tagline?: string;
  clientName?: string;
}

export const BillWiseLogo: React.FC<BillWiseLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'auto',
  showTagline = false,
  tagline = 'POS SYSTEM',
  clientName
}) => {
  const dimensions = {
    xs: { width: 95, height: 24, textClass: 'text-[6.5px]' },
    sm: { width: 125, height: 30, textClass: 'text-[7.5px]' },
    md: { width: 165, height: 38, textClass: 'text-[9px]' },
    lg: { width: 220, height: 50, textClass: 'text-[10px]' },
    xl: { width: 280, height: 64, textClass: 'text-[11px]' },
    '2xl': { width: 360, height: 82, textClass: 'text-[12px]' }
  };

  const { width, height, textClass } = dimensions[size] || dimensions.md;

  const strokeColor =
    variant === 'light'
      ? '#ffffff'
      : variant === 'dark'
      ? '#1e2432'
      : variant === 'blue'
      ? '#2563eb'
      : 'currentColor';

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 100"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-colors duration-200 overflow-visible max-w-full"
        aria-label="BiLLWiSE"
      >
        {/* Glyph 'B' (3-styled rounded geometric loops with middle connecting bar) */}
        <path
          d="M 28 50 H 72 C 92 50 104 40 104 30 C 104 18 88 15 66 15 H 26"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 28 50 H 72 C 92 50 104 60 104 70 C 104 82 88 85 66 85 H 26"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glyph 'i' (Stem + distinct rectangular dot) */}
        <line
          x1="124"
          y1="36"
          x2="124"
          y2="85"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <line
          x1="124"
          y1="16"
          x2="124"
          y2="23"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
        />

        {/* Glyph 'L' #1 */}
        <path
          d="M 148 15 V 85 H 188"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glyph 'L' #2 */}
        <path
          d="M 204 15 V 85 H 244"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glyph 'W' */}
        <path
          d="M 260 15 L 278 85 L 297 34 L 316 85 L 334 15"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glyph 'i' #2 */}
        <line
          x1="352"
          y1="36"
          x2="352"
          y2="85"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <line
          x1="352"
          y1="16"
          x2="352"
          y2="23"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
        />

        {/* Glyph 'S' */}
        <path
          d="M 412 28 C 412 18 396 15 382 15 C 368 15 360 23 360 32 C 360 46 376 50 394 54 C 412 58 418 66 418 73 C 418 82 404 85 388 85 C 372 85 362 78 360 71"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glyph 'E' (Three distinct horizontal parallel bars: Top, Mid, Bottom) */}
        <line
          x1="432"
          y1="21"
          x2="472"
          y2="21"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <line
          x1="432"
          y1="50"
          x2="472"
          y2="50"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <line
          x1="432"
          y1="79"
          x2="472"
          y2="79"
          stroke={strokeColor}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </svg>

      {showTagline && (
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`font-black uppercase tracking-[0.25em] ${textClass} ${
              variant === 'light'
                ? 'text-blue-200'
                : variant === 'blue'
                ? 'text-blue-600'
                : 'text-slate-400'
            }`}
          >
            {tagline}
          </span>
          {clientName && (
            <>
              <span className="text-slate-400 opacity-40">•</span>
              <span
                className={`font-black uppercase tracking-wider ${textClass} ${
                  variant === 'light' ? 'text-amber-300' : 'text-amber-600'
                }`}
              >
                Client: {clientName}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BillWiseLogo;
