interface AegisLogoProps {
  size?: number;
  className?: string;
}

export function AegisLogo({ size = 36, className = '' }: AegisLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 via-cyan-600 to-navy-700 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        width={size * 0.72}
        height={size * 0.72}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield/aegis outline */}
        <path
          d="M20 3 L33 8 L33 20 Q33 30 20 36 Q7 30 7 20 L7 8 Z"
          stroke="#0a1a33"
          strokeWidth="1.8"
          fill="none"
          opacity="0.35"
        />
        {/* Ocean wave */}
        <path
          d="M8 18 Q12 14 16 18 T24 18 T32 18"
          stroke="#0a1a33"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 23 Q12 19 16 23 T24 23 T32 23"
          stroke="#0a1a33"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        {/* Sonar/radar arc */}
        <circle cx="20" cy="16" r="5" stroke="#0a1a33" strokeWidth="1.2" fill="none" opacity="0.4" />
        <circle cx="20" cy="16" r="2" fill="#0a1a33" opacity="0.7" />
        {/* Sonar sweep line */}
        <line x1="20" y1="16" x2="25" y2="11" stroke="#0a1a33" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 rounded-lg animate-sonar-pulse border border-cyan-400/40" />
    </div>
  );
}
