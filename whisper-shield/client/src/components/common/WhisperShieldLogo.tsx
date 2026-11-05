import React from 'react';

interface WhisperShieldLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export const WhisperShieldLogo: React.FC<WhisperShieldLogoProps> = ({
  className = '',
  size = 36,
  showWordmark = false
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Whisper Emblem (User Reference Logo) */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-full overflow-hidden shadow-md ring-1 ring-black/15 dark:ring-white/20 bg-black"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          src="/logo.png"
          alt="WhisperShield Logo"
          className="w-full h-full object-cover rounded-full select-none pointer-events-none"
        />
      </div>

      {showWordmark && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm tracking-tight text-[#16303D] dark:text-[#FFFAF8] font-sans uppercase">
              Whisper<span className="text-[#285C70] dark:text-[#6C9BAD]">Shield</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#285C70]/15 text-[#285C70] dark:text-[#6C9BAD] font-bold border border-[#285C70]/30">
              E2EE v2.0
            </span>
          </div>
          <p className="text-[10px] text-[#757575] dark:text-[#A1A1A1] font-mono tracking-wider uppercase">
            Signal Protocol Engine
          </p>
        </div>
      )}
    </div>
  );
};

export default WhisperShieldLogo;