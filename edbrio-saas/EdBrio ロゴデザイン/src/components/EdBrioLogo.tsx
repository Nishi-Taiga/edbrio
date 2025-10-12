interface EdBrioLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function EdBrioLogo({ size = 120, showText = true, className = "" }: EdBrioLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle with Gradient */}
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="lightPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        
        {/* Main Circle Background */}
        <circle cx="60" cy="60" r="55" fill="url(#purpleGradient)" opacity="0.1" />
        
        {/* Book Icon - Left Page */}
        <path
          d="M35 40 C35 37, 37 35, 40 35 L55 35 L55 75 L40 75 C37 75, 35 73, 35 70 Z"
          fill="url(#purpleGradient)"
          opacity="0.8"
        />
        
        {/* Book Icon - Right Page */}
        <path
          d="M65 35 L80 35 C83 35, 85 37, 85 40 L85 70 C85 73, 83 75, 80 75 L65 75 Z"
          fill="url(#lightPurpleGradient)"
          opacity="0.9"
        />
        
        {/* Book Spine */}
        <rect x="55" y="35" width="10" height="40" fill="#7C3AED" />
        
        {/* Graduation Cap - Top */}
        <path
          d="M40 50 L60 42 L80 50 L60 58 Z"
          fill="#6D28D9"
          transform="translate(0, -10)"
        />
        
        {/* Graduation Cap - Tassel */}
        <circle cx="80" cy="38" r="2.5" fill="#8B5CF6" />
        <line x1="80" y1="40" x2="80" y2="46" stroke="#8B5CF6" strokeWidth="1.5" />
      </svg>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-[2.5rem] tracking-tight" style={{ 
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            lineHeight: 1
          }}>
            EdBrio
          </span>
          <span className="text-[0.875rem] text-purple-600/70 tracking-wide" style={{
            fontWeight: 500,
            marginTop: '0.25rem'
          }}>
            家庭教師予約サービス
          </span>
        </div>
      )}
    </div>
  );
}

// Alternative compact version for headers/navigation
export function EdBrioLogoCompact({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="purpleGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        
        <circle cx="60" cy="60" r="55" fill="url(#purpleGradientCompact)" opacity="0.1" />
        
        <path
          d="M35 40 C35 37, 37 35, 40 35 L55 35 L55 75 L40 75 C37 75, 35 73, 35 70 Z"
          fill="url(#purpleGradientCompact)"
          opacity="0.8"
        />
        
        <path
          d="M65 35 L80 35 C83 35, 85 37, 85 40 L85 70 C85 73, 83 75, 80 75 L65 75 Z"
          fill="#A78BFA"
          opacity="0.9"
        />
        
        <rect x="55" y="35" width="10" height="40" fill="#7C3AED" />
      </svg>
      
      <span className="text-[1.5rem] tracking-tight" style={{ 
        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 700
      }}>
        EdBrio
      </span>
    </div>
  );
}
