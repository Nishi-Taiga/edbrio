interface EdBrioLogoProps {
  size?: number;
  className?: string;
}

/**
 * EdBrio 最終ロゴデザイン
 *
 * 特徴:
 * - パープル (#7C3AED) からピンク (#DB2777) へのグラデーション背景
 * - 開いた本と卒業帽子のモチーフ（白色）
 * - アイコンに柔らかいドロップシャドウ
 * - 円形デザインで信頼感と完全性を表現
 */
export function EdBrioLogo({ size = 32, className = "" }: EdBrioLogoProps) {
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
        <linearGradient id="purplePinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <filter id="iconShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* グラデーション背景円 */}
      <circle cx="60" cy="60" r="52" fill="url(#purplePinkGradient)" />

      {/* 内側の透明円（奥行き効果） */}
      <circle cx="60" cy="60" r="45" fill="#FFFFFF" opacity="0.15" />

      <g filter="url(#iconShadow)">
        {/* 卒業帽子 - 上部中央 */}
        <path
          d="M38 42 L60 32 L82 42 L60 52 Z"
          fill="#FFFFFF"
        />

        {/* 卒業帽子のタッセル（房） */}
        <circle cx="80" cy="41" r="2" fill="#FFFFFF" />
        <line x1="80" y1="43" x2="80" y2="49" stroke="#FFFFFF" strokeWidth="2" />

        {/* 開いた本 - 左ページ */}
        <path
          d="M33 56 L33 80 C33 81.5, 34 82.5, 35.5 82.5 L57 82.5 L57 56 Z"
          fill="#FFFFFF"
        />

        {/* 開いた本 - 右ページ */}
        <path
          d="M63 56 L63 82.5 L84.5 82.5 C86 82.5, 87 81.5, 87 80 L87 56 Z"
          fill="#FFFFFF"
          opacity="0.85"
        />

        {/* 本の中央（背表紙） */}
        <rect x="57" y="56" width="6" height="26.5" fill="#FFFFFF" opacity="0.7" />
      </g>
    </svg>
  );
}

export default EdBrioLogo;
