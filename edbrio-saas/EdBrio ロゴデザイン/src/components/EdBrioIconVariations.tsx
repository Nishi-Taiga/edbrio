interface IconProps {
  size?: number;
  className?: string;
}

// バリエーション1: オリジナル（本と卒業帽子）
export function IconVariation1({ size = 120, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purpleGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="lightPurpleGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <circle cx="60" cy="60" r="55" fill="url(#purpleGradient1)" opacity="0.1" />
      
      <path
        d="M35 40 C35 37, 37 35, 40 35 L55 35 L55 75 L40 75 C37 75, 35 73, 35 70 Z"
        fill="url(#purpleGradient1)"
        opacity="0.8"
      />
      
      <path
        d="M65 35 L80 35 C83 35, 85 37, 85 40 L85 70 C85 73, 83 75, 80 75 L65 75 Z"
        fill="url(#lightPurpleGradient1)"
        opacity="0.9"
      />
      
      <rect x="55" y="35" width="10" height="40" fill="#7C3AED" />
      
      <path
        d="M40 50 L60 42 L80 50 L60 58 Z"
        fill="#6D28D9"
        transform="translate(0, -10)"
      />
      
      <circle cx="80" cy="38" r="2.5" fill="#8B5CF6" />
      <line x1="80" y1="40" x2="80" y2="46" stroke="#8B5CF6" strokeWidth="1.5" />
    </svg>
  );
}

// バリエーション2: ミニマルデザイン（シンプルな本と帽子）
export function IconVariation2({ size = 120, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purpleGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      
      <circle cx="60" cy="60" r="50" fill="url(#purpleGradient2)" />
      
      {/* 卒業帽子 - 上部中央 */}
      <path
        d="M35 48 L60 38 L85 48 L60 58 Z"
        fill="#FFFFFF"
      />
      
      <line x1="83" y1="48" x2="83" y2="56" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="83" cy="58" r="2" fill="#FFFFFF" />
      
      {/* 開いた本 - 下部中央 */}
      <path
        d="M32 62 L32 82 C32 83.5, 33 84.5, 34.5 84.5 L58 84.5 L58 62 Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      
      <path
        d="M62 62 L62 84.5 L85.5 84.5 C87 84.5, 88 83.5, 88 82 L88 62 Z"
        fill="#FFFFFF"
        opacity="0.7"
      />
      
      <rect x="58" y="62" width="4" height="22.5" fill="#FFFFFF" opacity="0.5" />
    </svg>
  );
}

// バリエーション3: 円形背景強調（モダンスタイル - パープルからピンクのグラデーション）
export function IconVariation3({ size = 120, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purplePinkGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <filter id="iconShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>
      
      <circle cx="60" cy="60" r="52" fill="url(#purplePinkGradient3)" />
      <circle cx="60" cy="60" r="45" fill="#FFFFFF" opacity="0.15" />
      
      <g filter="url(#iconShadow)">
        {/* 卒業帽子 - 上部中央（拡大） */}
        <path
          d="M38 42 L60 32 L82 42 L60 52 Z"
          fill="#FFFFFF"
        />
        
        <circle cx="80" cy="41" r="2" fill="#FFFFFF" />
        <line x1="80" y1="43" x2="80" y2="49" stroke="#FFFFFF" strokeWidth="2" />
        
        {/* 開いた本 - 下部中央（拡大） */}
        <path
          d="M33 56 L33 80 C33 81.5, 34 82.5, 35.5 82.5 L57 82.5 L57 56 Z"
          fill="#FFFFFF"
        />
        
        <path
          d="M63 56 L63 82.5 L84.5 82.5 C86 82.5, 87 81.5, 87 80 L87 56 Z"
          fill="#FFFFFF"
          opacity="0.85"
        />
        
        <rect x="57" y="56" width="6" height="26.5" fill="#FFFFFF" opacity="0.7" />
      </g>
    </svg>
  );
}

// バリエーション4: 開いた本が主役（卒業帽子は控えめ）
export function IconVariation4({ size = 120, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purpleGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="lightPurpleGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <circle cx="60" cy="60" r="55" fill="url(#purpleGradient4)" opacity="0.08" />
      
      <path
        d="M25 40 C25 36, 28 33, 32 33 L55 33 L55 80 L32 80 C28 80, 25 77, 25 73 Z"
        fill="url(#purpleGradient4)"
        opacity="0.85"
      />
      
      <path
        d="M65 33 L88 33 C92 33, 95 36, 95 40 L95 73 C95 77, 92 80, 88 80 L65 80 Z"
        fill="url(#lightPurpleGradient4)"
        opacity="0.95"
      />
      
      <rect x="55" y="33" width="10" height="47" fill="#7C3AED" />
      
      <path
        d="M70 30 L80 25 L90 30 L80 35 Z"
        fill="#6D28D9"
        opacity="0.6"
      />
      
      <line x1="89" y1="30" x2="89" y2="35" stroke="#8B5CF6" strokeWidth="1.2" />
      <circle cx="89" cy="36" r="1.5" fill="#8B5CF6" />
    </svg>
  );
}

// バリエーション5: 幾何学的モダンデザイン
export function IconVariation5({ size = 120, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purpleGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="lightPurpleGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      
      <rect x="10" y="10" width="100" height="100" rx="20" fill="url(#purpleGradient5)" opacity="0.1" />
      
      <path
        d="M30 45 L30 75 L57 75 L57 45 L43.5 38 Z"
        fill="url(#purpleGradient5)"
      />
      
      <path
        d="M63 45 L63 75 L90 75 L90 45 L76.5 38 Z"
        fill="url(#lightPurpleGradient5)"
      />
      
      <path
        d="M35 35 L60 22 L85 35 Z"
        fill="#6D28D9"
      />
      
      <circle cx="82" cy="33" r="2" fill="#8B5CF6" />
      <line x1="82" y1="35" x2="82" y2="42" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// バリエーション6: 文字「E」統合デザイン
export function IconVariation6({ size = 120, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purpleGradient6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      
      <circle cx="60" cy="60" r="54" fill="url(#purpleGradient6)" />
      
      <path
        d="M35 35 L75 35 L75 43 L45 43 L45 55 L70 55 L70 63 L45 63 L45 75 L75 75 L75 83 L35 83 Z"
        fill="#FFFFFF"
      />
      
      <path
        d="M40 28 L60 20 L80 28 L60 36 Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      
      <line x1="78" y1="28" x2="78" y2="34" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="78" cy="36" r="2" fill="#FFFFFF" />
    </svg>
  );
}

// バリエーション7: 立体的な本のデザイン
export function IconVariation7({ size = 120, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purpleGradient7a" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
        <linearGradient id="purpleGradient7b" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="purpleGradient7c" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <circle cx="60" cy="60" r="55" fill="#F3F4F6" />
      
      <path
        d="M30 42 L30 78 L57 75 L57 39 Z"
        fill="url(#purpleGradient7a)"
      />
      
      <path
        d="M63 39 L63 75 L90 78 L90 42 Z"
        fill="url(#purpleGradient7c)"
      />
      
      <path
        d="M57 39 L60 37 L63 39 L63 75 L60 77 L57 75 Z"
        fill="url(#purpleGradient7b)"
      />
      
      <path
        d="M35 32 L60 25 L85 32 L60 39 Z"
        fill="#6D28D9"
      />
      
      <circle cx="83" cy="31" r="2" fill="#8B5CF6" />
      <line x1="83" y1="33" x2="83" y2="38" stroke="#8B5CF6" strokeWidth="1.5" />
    </svg>
  );
}

// バリエーション8: バッジスタイル
export function IconVariation8({ size = 120, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purpleGradient8" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      
      <circle cx="60" cy="60" r="50" fill="url(#purpleGradient8)" />
      <circle cx="60" cy="60" r="42" fill="#FFFFFF" />
      <circle cx="60" cy="60" r="38" fill="url(#purpleGradient8)" opacity="0.1" />
      
      <path
        d="M40 50 L40 70 L57 70 L57 50 Z"
        fill="#7C3AED"
      />
      
      <path
        d="M63 50 L63 70 L80 70 L80 50 Z"
        fill="#A78BFA"
      />
      
      <rect x="57" y="50" width="6" height="20" fill="#6D28D9" />
      
      <path
        d="M44 45 L60 38 L76 45 L60 52 Z"
        fill="#6D28D9"
      />
    </svg>
  );
}
